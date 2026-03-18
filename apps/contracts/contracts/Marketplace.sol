// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Marketplace
 * @notice 文化作品交易市场
 *
 * 功能：
 *   - 固定价格上架/下架/购买
 *   - 报价/接受报价
 *   - 自动版税分配（ERC-2981）
 *   - Pull Payment 模式（防 Gas 炸弹）
 *
 * 安全：
 *   - ReentrancyGuard 防重入
 *   - Checks-Effects-Interactions 模式
 *   - 紧急暂停机制
 */
contract Marketplace is Ownable, Pausable, ReentrancyGuard {

    // ── 类型 ──────────────────────────────────────────────────

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 pricePerUnit; // wei
        uint256 amount;       // 剩余可购数量
        bool    active;
    }

    struct Offer {
        address buyer;
        uint256 tokenId;
        uint256 pricePerUnit; // wei
        uint256 amount;
        uint256 expiresAt;    // Unix timestamp
        bool    active;
    }

    // ── 状态变量 ─────────────────────────────────────────────

    IERC1155 public immutable nftContract;

    uint96  public platformFeeBps = 250; // 2.5%
    address public feeRecipient;

    uint256 private _nextListingId = 1;
    uint256 private _nextOfferId   = 1;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer)   public offers;

    /// Pull Payment：待提取余额
    mapping(address => uint256) private _pendingWithdrawals;

    // ── 事件 ─────────────────────────────────────────────────

    event ItemListed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address         seller,
        uint256         pricePerUnit,
        uint256         amount
    );
    event ItemDelisted(uint256 indexed listingId);
    event ItemSold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256         amount,
        uint256         totalPrice
    );
    event OfferMade(
        uint256 indexed offerId,
        uint256 indexed tokenId,
        address         buyer,
        uint256         pricePerUnit,
        uint256         amount,
        uint256         expiresAt
    );
    event OfferAccepted(uint256 indexed offerId);
    event OfferCancelled(uint256 indexed offerId);
    event Withdrawal(address indexed recipient, uint256 amount);
    event PlatformFeeUpdated(uint96 newFeeBps);

    // ── 错误 ─────────────────────────────────────────────────

    error ListingNotActive(uint256 listingId);
    error InsufficientPayment(uint256 required, uint256 sent);
    error InsufficientStock(uint256 requested, uint256 available);
    error NotSeller(address caller, address seller);
    error OfferNotActive(uint256 offerId);
    error OfferExpired(uint256 offerId);
    error NotBuyer(address caller, address buyer);
    error FeeTooHigh(uint96 given, uint96 max);
    error NothingToWithdraw();
    error WithdrawFailed();

    // ── 构造器 ────────────────────────────────────────────────

    constructor(address _nftContract, address _feeRecipient, address initialOwner)
        Ownable(initialOwner)
    {
        nftContract  = IERC1155(_nftContract);
        feeRecipient = _feeRecipient;
    }

    // ── 上架 / 下架 ───────────────────────────────────────────

    /**
     * @notice 上架作品（需先 setApprovalForAll 给本合约）
     * @param tokenId      作品 tokenId
     * @param pricePerUnit 每份售价（wei）
     * @param amount       上架数量
     * @return listingId   上架 ID
     */
    function listItem(
        uint256 tokenId,
        uint256 pricePerUnit,
        uint256 amount
    ) external whenNotPaused returns (uint256 listingId) {
        require(amount > 0, "amount=0");
        require(pricePerUnit > 0, "price=0");

        listingId = _nextListingId++;
        listings[listingId] = Listing({
            seller:       msg.sender,
            tokenId:      tokenId,
            pricePerUnit: pricePerUnit,
            amount:       amount,
            active:       true
        });

        emit ItemListed(listingId, tokenId, msg.sender, pricePerUnit, amount);
    }

    /** @notice 下架（卖家专属） */
    function delistItem(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingNotActive(listingId);
        if (listing.seller != msg.sender) revert NotSeller(msg.sender, listing.seller);

        listing.active = false;
        emit ItemDelisted(listingId);
    }

    // ── 购买 ─────────────────────────────────────────────────

    /**
     * @notice 购买上架作品
     * @param listingId  上架 ID
     * @param amount     购买数量
     *
     * 费用分配（Checks-Effects-Interactions）：
     *   成交价 = 平台手续费 + 版税 + 卖家收入
     *   所有收益先记入 _pendingWithdrawals，由各方主动 withdraw
     */
    function buyItem(uint256 listingId, uint256 amount)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        Listing storage listing = listings[listingId];

        // ── Checks ──────────────────────────────────────────
        if (!listing.active) revert ListingNotActive(listingId);
        if (amount > listing.amount) revert InsufficientStock(amount, listing.amount);

        uint256 totalPrice = listing.pricePerUnit * amount;
        if (msg.value < totalPrice) revert InsufficientPayment(totalPrice, msg.value);

        // ── Effects ─────────────────────────────────────────
        listing.amount -= amount;
        if (listing.amount == 0) listing.active = false;

        (uint256 platformFee, uint256 royalty, uint256 sellerAmount) =
            _splitPayment(listing.tokenId, totalPrice);

        _pendingWithdrawals[feeRecipient]  += platformFee;
        _pendingWithdrawals[listing.seller] += sellerAmount;
        // 版税接收方由 ERC-2981 决定，在 _splitPayment 中已查询
        // （此处简化：版税也计入 _pendingWithdrawals[royaltyReceiver]，见内部函数）

        // 退还多余 ETH
        uint256 excess = msg.value - totalPrice;

        // ── Interactions ─────────────────────────────────────
        nftContract.safeTransferFrom(listing.seller, msg.sender, listing.tokenId, amount, "");

        if (excess > 0) {
            (bool ok,) = msg.sender.call{value: excess}("");
            require(ok, "refund failed");
        }

        emit ItemSold(listingId, msg.sender, amount, totalPrice);
        // 抑制 unused variable warning
        (royalty);
    }

    // ── 报价 ─────────────────────────────────────────────────

    /**
     * @notice 发出报价（附带 MATIC 锁定）
     */
    function makeOffer(
        uint256 tokenId,
        uint256 amount,
        uint256 expiresAt
    ) external payable whenNotPaused returns (uint256 offerId) {
        require(amount > 0, "amount=0");
        require(expiresAt > block.timestamp, "already expired");
        uint256 totalValue = msg.value;
        require(totalValue > 0, "no payment");

        offerId = _nextOfferId++;
        offers[offerId] = Offer({
            buyer:        msg.sender,
            tokenId:      tokenId,
            pricePerUnit: totalValue / amount,
            amount:       amount,
            expiresAt:    expiresAt,
            active:       true
        });

        emit OfferMade(offerId, tokenId, msg.sender, totalValue / amount, amount, expiresAt);
    }

    /**
     * @notice 接受报价（NFT 持有者调用）
     */
    function acceptOffer(uint256 offerId) external nonReentrant whenNotPaused {
        Offer storage offer = offers[offerId];

        if (!offer.active) revert OfferNotActive(offerId);
        if (block.timestamp > offer.expiresAt) revert OfferExpired(offerId);

        offer.active = false;

        uint256 totalPrice = offer.pricePerUnit * offer.amount;
        (uint256 platformFee, uint256 royalty, uint256 sellerAmount) =
            _splitPayment(offer.tokenId, totalPrice);

        _pendingWithdrawals[feeRecipient] += platformFee;
        _pendingWithdrawals[msg.sender]   += sellerAmount;

        nftContract.safeTransferFrom(msg.sender, offer.buyer, offer.tokenId, offer.amount, "");

        emit OfferAccepted(offerId);
        (royalty);
    }

    /**
     * @notice 取消报价（买家调用，退款）
     */
    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        if (!offer.active) revert OfferNotActive(offerId);
        if (offer.buyer != msg.sender) revert NotBuyer(msg.sender, offer.buyer);

        offer.active = false;
        uint256 refund = offer.pricePerUnit * offer.amount;

        (bool ok,) = msg.sender.call{value: refund}("");
        require(ok, "refund failed");

        emit OfferCancelled(offerId);
    }

    // ── Pull Payment ─────────────────────────────────────────

    /**
     * @notice 提取待收款（卖家/创作者/平台调用）
     */
    function withdraw() external nonReentrant {
        uint256 amount = _pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        _pendingWithdrawals[msg.sender] = 0;

        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert WithdrawFailed();

        emit Withdrawal(msg.sender, amount);
    }

    function pendingWithdrawal(address account) external view returns (uint256) {
        return _pendingWithdrawals[account];
    }

    // ── 管理员 ────────────────────────────────────────────────

    function setFeeRate(uint96 bps) external onlyOwner {
        if (bps > 1000) revert FeeTooHigh(bps, 1000); // 最高 10%
        platformFeeBps = bps;
        emit PlatformFeeUpdated(bps);
    }

    function setFeeRecipient(address recipient) external onlyOwner {
        feeRecipient = recipient;
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ── 内部：费用分配 ────────────────────────────────────────

    /**
     * @dev 从总价中拆分：平台手续费、版税（ERC-2981）、卖家收入
     */
    function _splitPayment(uint256 tokenId, uint256 totalPrice)
        internal
        returns (uint256 platformFee, uint256 royalty, uint256 sellerAmount)
    {
        platformFee = (totalPrice * platformFeeBps) / 10000;

        // 查询 ERC-2981 版税
        try IERC2981(address(nftContract)).royaltyInfo(tokenId, totalPrice)
            returns (address receiver, uint256 royaltyAmount)
        {
            royalty = royaltyAmount;
            _pendingWithdrawals[receiver] += royaltyAmount;
        } catch {
            royalty = 0;
        }

        sellerAmount = totalPrice - platformFee - royalty;
    }

    // 接受 ETH（用于报价锁定）
    receive() external payable {}
}
