// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EDUToken
 * @dev 平台代币，用于治理和激励
 */
contract EDUToken is ERC20, ERC20Burnable, Ownable {
    // 空投锁定
    mapping(address => uint256) public airdropLock;
    
    // 每次销毁的百分比分配给奖学金池（5%）
    uint256 public constant SCHOLARSHIP_PERCENT = 5;
    
    // 奖学金池地址
    address public scholarshipPool;
    
    // 事件
    event ScholarshipFunded(uint256 amount);
    event AirdropLocked(address indexed recipient, uint256 amount, uint256 unlockTime);
    event AirdropClaimed(address indexed recipient, uint256 amount);
    
    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) Ownable(msg.sender) {
        // 初始代币分配
        _mint(msg.sender, initialSupply);
        
        // 设置奖学金池（此处简化为合约自身地址，实际应为多签钱包）
        scholarshipPool = address(this);
    }
    
    /**
     * @dev 设置奖学金池地址
     */
    function setScholarshipPool(address _scholarshipPool) external onlyOwner {
        require(_scholarshipPool != address(0), "Invalid scholarship pool address");
        scholarshipPool = _scholarshipPool;
    }
    
    /**
     * @dev 铸造新代币（仅限所有者）
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev 销毁代币并将一部分转入奖学金池
     */
    function burnWithScholarship(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        // 计算奖学金池分配
        uint256 scholarshipAmount = (amount * SCHOLARSHIP_PERCENT) / 100;
        uint256 burnAmount = amount - scholarshipAmount;
        
        // 转账到奖学金池
        _transfer(msg.sender, scholarshipPool, scholarshipAmount);
        
        // 销毁剩余部分
        _burn(msg.sender, burnAmount);
        
        emit ScholarshipFunded(scholarshipAmount);
    }
    
    /**
     * @dev 锁定空投代币
     */
    function lockAirdrop(address recipient, uint256 amount, uint256 lockDuration) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(lockDuration > 0, "Lock duration must be greater than 0");
        
        uint256 unlockTime = block.timestamp + lockDuration;
        airdropLock[recipient] = unlockTime;
        
        // 转账代币到接收者地址
        _transfer(msg.sender, recipient, amount);
        
        emit AirdropLocked(recipient, amount, unlockTime);
    }
    
    /**
     * @dev 重写transfer函数，添加锁定检查
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        // 检查发送者的锁定状态
        if (airdropLock[msg.sender] > 0) {
            require(block.timestamp >= airdropLock[msg.sender], "Tokens are locked");
            // 解锁完成后清除锁定记录
            if (block.timestamp >= airdropLock[msg.sender]) {
                airdropLock[msg.sender] = 0;
            }
        }
        
        return super.transfer(to, amount);
    }
    
    /**
     * @dev 重写transferFrom函数，添加锁定检查
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        // 检查发送者的锁定状态
        if (airdropLock[from] > 0) {
            require(block.timestamp >= airdropLock[from], "Tokens are locked");
            // 解锁完成后清除锁定记录
            if (block.timestamp >= airdropLock[from]) {
                airdropLock[from] = 0;
            }
        }
        
        return super.transferFrom(from, to, amount);
    }
} 