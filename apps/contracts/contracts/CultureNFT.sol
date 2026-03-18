// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CultureNFT
 * @notice 文化作品 NFT 合约
 *         - ERC-1155：支持同一作品多份发行（限量书籍、版画等）
 *         - ERC-2981：版税标准，二级市场自动分成给创作者
 *         - 链上记录作品 contentHash，用于版权核查
 *
 * @dev 铸造流程：
 *      1. 创作者调用 mint()，传入 IPFS metadataURI 和版税设置
 *      2. 合约发行 NFT 并记录创作者地址与 contentHash
 *      3. 任何人可通过 verifyContent(hash) 查询版权归属
 */
contract CultureNFT is ERC1155, ERC1155Supply, ERC2981, Ownable, Pausable {
    using Strings for uint256;

    // ── 类型 ──────────────────────────────────────────────────

    enum WorkCategory {
        Painting,
        Book,
        Film,
        Music,
        Other
    }

    struct WorkInfo {
        address   creator;
        uint96    royaltyBps;    // 版税率 (basis points, 1% = 100, 上限 1000 = 10%)
        uint256   maxSupply;     // 最大发行量（0 = 无限）
        string    contentHash;   // 作品文件 SHA-256 哈希，格式 "sha256:..."
        WorkCategory category;
    }

    // ── 状态变量 ─────────────────────────────────────────────

    uint256 private _nextTokenId = 1;
    uint96  public constant MAX_ROYALTY_BPS = 1000; // 10%

    /// tokenId => WorkInfo
    mapping(uint256 => WorkInfo) private _works;

    /// tokenId => metadataURI
    mapping(uint256 => string)   private _tokenURIs;

    /// contentHash => tokenId（版权查询索引）
    mapping(string  => uint256)  private _contentHashIndex;

    // ── 事件 ─────────────────────────────────────────────────

    event WorkMinted(
        uint256 indexed tokenId,
        address indexed creator,
        uint256         supply,
        string          metadataURI
    );

    event WorkBurned(
        uint256 indexed tokenId,
        address indexed burner,
        uint256         amount
    );

    // ── 错误 ─────────────────────────────────────────────────

    error RoyaltyTooHigh(uint96 given, uint96 max);
    error ExceedsMaxSupply(uint256 requested, uint256 remaining);
    error NotCreator(address caller, address creator);
    error ContentHashAlreadyRegistered(string contentHash, uint256 existingTokenId);
    error EmptyContentHash();

    // ── 构造器 ────────────────────────────────────────────────

    constructor(address initialOwner)
        ERC1155("")
        Ownable(initialOwner)
    {}

    // ── 对外函数 ──────────────────────────────────────────────

    /**
     * @notice 铸造单个文化作品 NFT
     * @param metadataURI  IPFS metadata URI（传给 ERC-1155 标准）
     * @param royaltyBps   版税率，单位 basis points（500 = 5%，最大 1000）
     * @param supply       发行数量（0 表示无限制）
     * @param contentHash  作品原文件 SHA-256 哈希，用于版权核查
     * @param category     作品分类
     * @return tokenId     新铸造的 tokenId
     */
    function mint(
        string memory metadataURI,
        uint96  royaltyBps,
        uint256 supply,
        string  memory contentHash,
        WorkCategory category
    ) external whenNotPaused returns (uint256 tokenId) {
        _validateRoyalty(royaltyBps);
        _validateContentHash(contentHash);

        tokenId = _nextTokenId++;

        // 版税设置（ERC-2981）
        _setTokenRoyalty(tokenId, msg.sender, royaltyBps);

        // 记录作品信息
        _works[tokenId] = WorkInfo({
            creator:     msg.sender,
            royaltyBps:  royaltyBps,
            maxSupply:   supply,
            contentHash: contentHash,
            category:    category
        });
        _tokenURIs[tokenId]              = metadataURI;
        _contentHashIndex[contentHash]   = tokenId;

        // 铸造 NFT（supply = 0 时铸 1 份给创作者，代表所有权凭证）
        uint256 mintAmount = supply == 0 ? 1 : supply;
        _mint(msg.sender, tokenId, mintAmount, "");

        emit WorkMinted(tokenId, msg.sender, mintAmount, metadataURI);
    }

    /**
     * @notice 销毁作品（创作者可撤回未售出份额）
     */
    function burn(uint256 tokenId, uint256 amount) external {
        WorkInfo storage work = _works[tokenId];
        if (work.creator != msg.sender) revert NotCreator(msg.sender, work.creator);
        _burn(msg.sender, tokenId, amount);
        emit WorkBurned(tokenId, msg.sender, amount);
    }

    // ── 查询函数 ──────────────────────────────────────────────

    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function getWorkInfo(uint256 tokenId) external view returns (WorkInfo memory) {
        return _works[tokenId];
    }

    /**
     * @notice 版权核查：传入文件哈希，返回对应 tokenId（0 表示未注册）
     */
    function verifyContent(string memory contentHash) external view returns (uint256) {
        return _contentHashIndex[contentHash];
    }

    // ── 管理员函数 ────────────────────────────────────────────

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ── 内部函数 ──────────────────────────────────────────────

    function _validateRoyalty(uint96 bps) internal pure {
        if (bps > MAX_ROYALTY_BPS) revert RoyaltyTooHigh(bps, MAX_ROYALTY_BPS);
    }

    function _validateContentHash(string memory hash) internal view {
        if (bytes(hash).length == 0) revert EmptyContentHash();
        uint256 existing = _contentHashIndex[hash];
        if (existing != 0) revert ContentHashAlreadyRegistered(hash, existing);
    }

    // ── 接口覆盖（多重继承所需）───────────────────────────────

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
