// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title LiquidityPool
 * @dev 课程代币与ETH的流动性池
 */
contract LiquidityPool is Ownable, ReentrancyGuard {
    using Math for uint256;

    // 常量
    uint256 private constant MINIMUM_LIQUIDITY = 10**3;
    uint256 private constant FEE_DENOMINATOR = 1000;
    
    // 交易手续费 (3 = 0.3%)
    uint256 public tradingFee = 3;
    
    // 特殊池激励 (300 = 3倍收益)
    uint256 public specialPoolMultiplier = 300;
    
    // 平台代币地址
    address public platformTokenAddress;
    
    // 代币储备
    mapping(address => uint256) public tokenReserves;
    mapping(address => uint256) public ethReserves;
    
    // 流动性提供者代币余额
    mapping(address => mapping(address => uint256)) public lpBalances;
    
    // 总流动性代币供应量
    mapping(address => uint256) public totalLpTokens;
    
    // 冷门池标记（课程代币地址=>是否冷门）
    mapping(address => bool) public isSpecialPool;
    
    // 流动性锁定时间（课程代币地址=>解锁时间戳）
    mapping(address => uint256) public liquidityUnlockTime;
    
    // 事件
    event LiquidityAdded(address indexed provider, address indexed tokenAddress, uint256 tokenAmount, uint256 ethAmount, uint256 lpTokens);
    event LiquidityRemoved(address indexed provider, address indexed tokenAddress, uint256 tokenAmount, uint256 ethAmount, uint256 lpTokens);
    event Swap(address indexed user, address indexed tokenAddress, uint256 tokenIn, uint256 ethIn, uint256 tokenOut, uint256 ethOut);
    event PoolCreated(address indexed tokenAddress, uint256 initialTokenAmount, uint256 initialEthAmount);
    
    constructor(address _platformTokenAddress) Ownable(msg.sender) {
        require(_platformTokenAddress != address(0), "Invalid platform token address");
        platformTokenAddress = _platformTokenAddress;
    }
    
    /**
     * @dev 创建新的流动性池
     */
    function createPool(address tokenAddress, uint256 tokenAmount, bool isSpecial) external payable nonReentrant returns (bool) {
        require(tokenAddress != address(0), "Invalid token address");
        require(totalLpTokens[tokenAddress] == 0, "Pool already exists");
        require(tokenAmount > 0 && msg.value > 0, "Insufficient liquidity");
        
        // 标记特殊池
        if (isSpecial) {
            isSpecialPool[tokenAddress] = true;
        }
        
        // 初始流动性锁定48小时
        liquidityUnlockTime[tokenAddress] = block.timestamp + 48 hours;
        
        // 转移代币到合约
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), tokenAmount);
        
        // 计算初始代币，减去MINIMUM_LIQUIDITY防止首次流动性过低
        uint256 initialLpTokens = Math.sqrt(tokenAmount * msg.value) - MINIMUM_LIQUIDITY;
        
        // 更新状态
        tokenReserves[tokenAddress] = tokenAmount;
        ethReserves[tokenAddress] = msg.value;
        lpBalances[tokenAddress][msg.sender] = initialLpTokens;
        totalLpTokens[tokenAddress] = initialLpTokens + MINIMUM_LIQUIDITY;
        
        emit PoolCreated(tokenAddress, tokenAmount, msg.value);
        emit LiquidityAdded(msg.sender, tokenAddress, tokenAmount, msg.value, initialLpTokens);
        
        return true;
    }
    
    /**
     * @dev 添加流动性
     */
    function addLiquidity(address tokenAddress, uint256 tokenAmount) external payable nonReentrant returns (uint256) {
        require(tokenAddress != address(0), "Invalid token address");
        require(totalLpTokens[tokenAddress] > 0, "Pool does not exist");
        require(tokenAmount > 0 && msg.value > 0, "Insufficient liquidity");
        
        uint256 _tokenReserve = tokenReserves[tokenAddress];
        uint256 _ethReserve = ethReserves[tokenAddress];
        
        // 计算应提供的代币数量与ETH按比例
        uint256 ethToToken = (msg.value * _tokenReserve) / _ethReserve;
        uint256 tokenToEth = (tokenAmount * _ethReserve) / _tokenReserve;
        
        // 确定最终添加的数量
        uint256 finalTokenAmount;
        uint256 finalEthAmount;
        
        if (tokenToEth <= msg.value) {
            // 代币是限制因素
            finalTokenAmount = tokenAmount;
            finalEthAmount = tokenToEth;
        } else {
            // ETH是限制因素
            finalTokenAmount = ethToToken;
            finalEthAmount = msg.value;
        }
        
        // 退还多余的ETH
        if (finalEthAmount < msg.value) {
            payable(msg.sender).transfer(msg.value - finalEthAmount);
        }
        
        // 转移代币到合约
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), finalTokenAmount);
        
        // 计算LP代币数量
        uint256 lpTokens = (finalTokenAmount * totalLpTokens[tokenAddress]) / _tokenReserve;
        
        // 更新状态
        tokenReserves[tokenAddress] += finalTokenAmount;
        ethReserves[tokenAddress] += finalEthAmount;
        lpBalances[tokenAddress][msg.sender] += lpTokens;
        totalLpTokens[tokenAddress] += lpTokens;
        
        emit LiquidityAdded(msg.sender, tokenAddress, finalTokenAmount, finalEthAmount, lpTokens);
        
        return lpTokens;
    }
    
    /**
     * @dev 移除流动性
     */
    function removeLiquidity(address tokenAddress, uint256 lpTokenAmount) external nonReentrant returns (uint256, uint256) {
        require(tokenAddress != address(0), "Invalid token address");
        require(lpTokenAmount > 0, "Invalid LP token amount");
        require(lpBalances[tokenAddress][msg.sender] >= lpTokenAmount, "Insufficient LP tokens");
        
        // 检查锁定期是否已过
        require(block.timestamp >= liquidityUnlockTime[tokenAddress], "Liquidity still locked");
        
        uint256 tokenAmount = (lpTokenAmount * tokenReserves[tokenAddress]) / totalLpTokens[tokenAddress];
        uint256 ethAmount = (lpTokenAmount * ethReserves[tokenAddress]) / totalLpTokens[tokenAddress];
        
        // 更新状态
        lpBalances[tokenAddress][msg.sender] -= lpTokenAmount;
        totalLpTokens[tokenAddress] -= lpTokenAmount;
        tokenReserves[tokenAddress] -= tokenAmount;
        ethReserves[tokenAddress] -= ethAmount;
        
        // 转移资产
        IERC20(tokenAddress).transfer(msg.sender, tokenAmount);
        payable(msg.sender).transfer(ethAmount);
        
        emit LiquidityRemoved(msg.sender, tokenAddress, tokenAmount, ethAmount, lpTokenAmount);
        
        return (tokenAmount, ethAmount);
    }
    
    /**
     * @dev 计算交易输出
     */
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public view returns (uint256) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * (1000 - tradingFee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        
        return numerator / denominator;
    }
    
    /**
     * @dev ETH换代币
     */
    function swapETHForToken(address tokenAddress, uint256 minTokenOut, address recipient) external payable nonReentrant returns (uint256) {
        require(tokenAddress != address(0), "Invalid token address");
        require(totalLpTokens[tokenAddress] > 0, "Pool does not exist");
        require(msg.value > 0, "Must send ETH");
        
        uint256 tokenReserve = tokenReserves[tokenAddress];
        uint256 ethReserve = ethReserves[tokenAddress];
        
        uint256 tokenOut = getAmountOut(msg.value, ethReserve, tokenReserve);
        
        require(tokenOut >= minTokenOut, "Insufficient output amount");
        
        // 更新储备
        tokenReserves[tokenAddress] = tokenReserve - tokenOut;
        ethReserves[tokenAddress] = ethReserve + msg.value;
        
        // 转移代币
        IERC20(tokenAddress).transfer(recipient, tokenOut);
        
        emit Swap(msg.sender, tokenAddress, 0, msg.value, tokenOut, 0);
        
        return tokenOut;
    }
    
    /**
     * @dev 代币换ETH
     */
    function swapTokenForETH(address tokenAddress, uint256 tokenIn, uint256 minEthOut) external nonReentrant returns (uint256) {
        require(tokenAddress != address(0), "Invalid token address");
        require(totalLpTokens[tokenAddress] > 0, "Pool does not exist");
        require(tokenIn > 0, "Must send tokens");
        
        uint256 tokenReserve = tokenReserves[tokenAddress];
        uint256 ethReserve = ethReserves[tokenAddress];
        
        uint256 ethOut = getAmountOut(tokenIn, tokenReserve, ethReserve);
        
        require(ethOut >= minEthOut, "Insufficient output amount");
        
        // 更新储备
        tokenReserves[tokenAddress] = tokenReserve + tokenIn;
        ethReserves[tokenAddress] = ethReserve - ethOut;
        
        // 转移资产
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), tokenIn);
        payable(msg.sender).transfer(ethOut);
        
        emit Swap(msg.sender, tokenAddress, tokenIn, 0, 0, ethOut);
        
        return ethOut;
    }
    
    /**
     * @dev 获取池子信息
     */
    function getPoolInfo(address tokenAddress) external view returns (
        uint256 tokenReserve,
        uint256 ethReserve,
        uint256 totalLp,
        bool isSpecial,
        uint256 unlockTime
    ) {
        return (
            tokenReserves[tokenAddress],
            ethReserves[tokenAddress],
            totalLpTokens[tokenAddress],
            isSpecialPool[tokenAddress],
            liquidityUnlockTime[tokenAddress]
        );
    }
    
    /**
     * @dev 获取流动性提供者信息
     */
    function getLpInfo(address tokenAddress, address provider) external view returns (
        uint256 lpBalance,
        uint256 tokenShare,
        uint256 ethShare
    ) {
        uint256 lpBalance_ = lpBalances[tokenAddress][provider];
        
        return (
            lpBalance_,
            (lpBalance_ * tokenReserves[tokenAddress]) / totalLpTokens[tokenAddress],
            (lpBalance_ * ethReserves[tokenAddress]) / totalLpTokens[tokenAddress]
        );
    }
    
    /**
     * @dev 设置交易手续费
     */
    function setTradingFee(uint256 newFee) external onlyOwner {
        require(newFee <= 30, "Fee too high"); // 最高3%
        tradingFee = newFee;
    }
    
    /**
     * @dev 设置冷门池倍率
     */
    function setSpecialPoolMultiplier(uint256 newMultiplier) external onlyOwner {
        require(newMultiplier >= 100, "Multiplier too low"); // 至少1倍
        require(newMultiplier <= 500, "Multiplier too high"); // 最多5倍
        specialPoolMultiplier = newMultiplier;
    }
    
    /**
     * @dev 标记特殊池
     */
    function markSpecialPool(address tokenAddress, bool isSpecial) external onlyOwner {
        require(totalLpTokens[tokenAddress] > 0, "Pool does not exist");
        isSpecialPool[tokenAddress] = isSpecial;
    }
    
    /**
     * @dev 价格熔断机制 - 检查价格波动
     */
    function checkPriceVolatility(address tokenAddress, uint256 amountIn, bool isEthToToken) external view returns (bool isTooVolatile) {
        uint256 tokenReserve = tokenReserves[tokenAddress];
        uint256 ethReserve = ethReserves[tokenAddress];
        
        // 计算交易后的价格
        uint256 amountOut;
        uint256 newPrice;
        uint256 oldPrice = (ethReserve * 1e18) / tokenReserve; // 当前ETH/代币价格（放大1e18倍）
        
        if (isEthToToken) {
            amountOut = getAmountOut(amountIn, ethReserve, tokenReserve);
            newPrice = ((ethReserve + amountIn) * 1e18) / (tokenReserve - amountOut);
        } else {
            amountOut = getAmountOut(amountIn, tokenReserve, ethReserve);
            newPrice = ((ethReserve - amountOut) * 1e18) / (tokenReserve + amountIn);
        }
        
        // 计算价格变化百分比
        uint256 priceChange;
        if (newPrice > oldPrice) {
            priceChange = ((newPrice - oldPrice) * 100) / oldPrice;
        } else {
            priceChange = ((oldPrice - newPrice) * 100) / oldPrice;
        }
        
        // 波动超过20%则视为过于波动
        return priceChange > 20;
    }
    
    /**
     * @dev 接收ETH
     */
    receive() external payable {}
} 