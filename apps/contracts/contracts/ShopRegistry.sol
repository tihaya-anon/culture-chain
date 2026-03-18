// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ShopRegistry
 * @notice 创作者店铺注册表
 *         每个以太坊地址只能注册一个店铺，店铺名唯一
 *         元数据（头像、简介、Banner）存储在 IPFS，链上仅记录 URI
 */
contract ShopRegistry is Ownable {

    struct Shop {
        address owner;
        string  name;
        string  metadataURI;
        uint256 createdAt;
        bool    verified;
    }

    /// owner => Shop
    mapping(address => Shop) private _shops;

    /// 店铺名 => owner（用于唯一性校验）
    mapping(string => address) private _nameToOwner;

    event ShopRegistered(address indexed owner, string name);
    event ShopUpdated(address indexed owner, string metadataURI);
    event ShopVerified(address indexed owner);

    error AlreadyRegistered(address owner);
    error NameTaken(string name);
    error NotRegistered(address owner);
    error EmptyName();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice 注册店铺（每个地址只能注册一次）
     * @param name         店铺名（不可重复）
     * @param metadataURI  IPFS URI，包含头像、简介等元数据
     */
    function registerShop(string memory name, string memory metadataURI) external {
        if (_shops[msg.sender].owner != address(0)) revert AlreadyRegistered(msg.sender);
        if (bytes(name).length == 0) revert EmptyName();
        if (_nameToOwner[name] != address(0)) revert NameTaken(name);

        _shops[msg.sender] = Shop({
            owner:       msg.sender,
            name:        name,
            metadataURI: metadataURI,
            createdAt:   block.timestamp,
            verified:    false
        });
        _nameToOwner[name] = msg.sender;

        emit ShopRegistered(msg.sender, name);
    }

    /**
     * @notice 更新店铺元数据（仅店铺 owner 可调用）
     */
    function updateShopMeta(string memory metadataURI) external {
        if (_shops[msg.sender].owner == address(0)) revert NotRegistered(msg.sender);
        _shops[msg.sender].metadataURI = metadataURI;
        emit ShopUpdated(msg.sender, metadataURI);
    }

    // ── 查询 ─────────────────────────────────────────────────

    function getShop(address owner) external view returns (Shop memory) {
        return _shops[owner];
    }

    function getShopByName(string memory name) external view returns (Shop memory) {
        return _shops[_nameToOwner[name]];
    }

    function isRegistered(address owner) external view returns (bool) {
        return _shops[owner].owner != address(0);
    }

    // ── 管理员 ────────────────────────────────────────────────

    /** @notice 平台认证创作者（官方蓝 V） */
    function verifyShop(address owner) external onlyOwner {
        if (_shops[owner].owner == address(0)) revert NotRegistered(owner);
        _shops[owner].verified = true;
        emit ShopVerified(owner);
    }
}
