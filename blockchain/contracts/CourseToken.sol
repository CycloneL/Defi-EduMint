// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CourseToken
 * @dev 课程代币实现，每个课程都有自己的代币
 */
contract CourseToken is ERC20, Ownable {
    // 代币分配
    uint256 private constant LIQUIDITY_POOL = 60; // 60%流动性池
    uint256 private constant CREATOR_ALLOCATION = 20; // 20%创作者保留
    uint256 private constant COMMUNITY_INCENTIVES = 20; // 20%社区激励池

    // 代币地址
    address public liquidityPoolAddress;
    address public communityIncentivesAddress;

    // 交易税率（以千分之一为单位）
    uint256 public tradeTaxRate = 20; // 2%
    
    // 交易税分配比例（以百分比为单位）
    uint256 public burnTaxPercentage = 50; // 50%销毁
    uint256 public scholarshipTaxPercentage = 50; // 50%奖学金池
    
    // 奖学金池地址
    address public scholarshipPoolAddress;
    
    // 波段交易优惠
    mapping(address => uint256) public holdingSince;
    
    // 事件
    event TaxCollected(address indexed from, address indexed to, uint256 taxAmount);
    event TaxDistributed(uint256 burnAmount, uint256 scholarshipAmount);

    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address creator
    ) ERC20(name, symbol) Ownable(creator) {
        // 临时设置为创建者地址，在实际部署时应该设置为真实地址
        liquidityPoolAddress = creator;
        communityIncentivesAddress = creator;
        scholarshipPoolAddress = creator;
        
        // 分配代币
        _mint(liquidityPoolAddress, (totalSupply * LIQUIDITY_POOL) / 100);
        _mint(creator, (totalSupply * CREATOR_ALLOCATION) / 100);
        _mint(communityIncentivesAddress, (totalSupply * COMMUNITY_INCENTIVES) / 100);
        
        // 设置创建者的持有时间为创建时间
        holdingSince[creator] = block.timestamp;
    }

    /**
     * @dev 覆盖transfer方法以应用交易税
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        return _transferWithTax(msg.sender, to, amount);
    }

    /**
     * @dev 覆盖transferFrom方法以应用交易税
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        return _transferWithTax(from, to, amount);
    }

    /**
     * @dev 内部带税转账方法
     */
    function _transferWithTax(address from, address to, uint256 amount) internal returns (bool) {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        
        // 检查是否需要征税（创建者和系统地址免税）
        bool isTaxExempt = from == owner() || 
                           to == owner() || 
                           from == liquidityPoolAddress || 
                           to == liquidityPoolAddress || 
                           from == communityIncentivesAddress || 
                           to == communityIncentivesAddress || 
                           from == scholarshipPoolAddress;
        
        // 应用波段交易折扣
        uint256 effectiveTaxRate = tradeTaxRate;
        if (!isTaxExempt && holdingSince[from] > 0) {
            uint256 holdingDuration = block.timestamp - holdingSince[from];
            
            // 持有超过7天享受折扣
            if (holdingDuration > 7 days) {
                effectiveTaxRate = effectiveTaxRate * 80 / 100; // 20%折扣
            }
            
            // 持有超过30天享受更多折扣
            if (holdingDuration > 30 days) {
                effectiveTaxRate = effectiveTaxRate * 60 / 100; // 40%折扣
            }
        }
        
        // 计算税额
        uint256 taxAmount = 0;
        if (!isTaxExempt) {
            taxAmount = (amount * effectiveTaxRate) / 1000;
        }
        
        // 执行转账
        if (taxAmount > 0) {
            // 计算销毁金额和奖学金池金额
            uint256 burnAmount = (taxAmount * burnTaxPercentage) / 100;
            uint256 scholarshipAmount = taxAmount - burnAmount;
            
            // 执行实际转账
            super._transfer(from, address(this), taxAmount); // 先收取税
            super._transfer(from, to, amount - taxAmount); // 然后转账扣除税后的金额
            
            // 分配税收
            if (burnAmount > 0) {
                _burn(address(this), burnAmount);
            }
            
            if (scholarshipAmount > 0) {
                super._transfer(address(this), scholarshipPoolAddress, scholarshipAmount);
            }
            
            emit TaxCollected(from, to, taxAmount);
            emit TaxDistributed(burnAmount, scholarshipAmount);
        } else {
            super._transfer(from, to, amount);
        }
        
        // 更新接收者的持有时间
        holdingSince[to] = block.timestamp;
        
        return true;
    }
    
    /**
     * @dev 设置交易税率
     */
    function setTradeTaxRate(uint256 newRate) external onlyOwner {
        require(newRate <= 50, "Tax rate too high"); // 最高5%
        tradeTaxRate = newRate;
    }
    
    /**
     * @dev 设置税收分配比例
     */
    function setTaxDistribution(uint256 burnPercentage, uint256 scholarshipPercentage) external onlyOwner {
        require(burnPercentage + scholarshipPercentage == 100, "Percentages must sum to 100");
        burnTaxPercentage = burnPercentage;
        scholarshipTaxPercentage = scholarshipPercentage;
    }
    
    /**
     * @dev 设置地址
     */
    function setAddresses(
        address _liquidityPoolAddress,
        address _communityIncentivesAddress,
        address _scholarshipPoolAddress
    ) external onlyOwner {
        require(_liquidityPoolAddress != address(0), "Invalid liquidity pool address");
        require(_communityIncentivesAddress != address(0), "Invalid community incentives address");
        require(_scholarshipPoolAddress != address(0), "Invalid scholarship pool address");
        
        liquidityPoolAddress = _liquidityPoolAddress;
        communityIncentivesAddress = _communityIncentivesAddress;
        scholarshipPoolAddress = _scholarshipPoolAddress;
    }
    
    /**
     * @dev 获取持有者的持有时长（秒）
     */
    function getHoldingDuration(address holder) external view returns (uint256) {
        if (holdingSince[holder] == 0) {
            return 0;
        }
        return block.timestamp - holdingSince[holder];
    }
} 