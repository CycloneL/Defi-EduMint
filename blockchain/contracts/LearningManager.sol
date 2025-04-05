// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CourseFactory.sol";

/**
 * @title LearningManager
 * @dev 负责管理学习者的学习过程、质押和奖励
 */
contract LearningManager is Ownable, ReentrancyGuard {
    // 课程工厂合约
    CourseFactory public courseFactory;
    
    // 学习记录
    struct LearningRecord {
        uint256 courseId;
        address learner;
        uint256 stakedAmount;
        uint256 startTime;
        uint256 lastCheckpointTime;
        uint256 progressPercent; // 0-100
        bool completed;
        bool isActive;
    }
    
    // 学习记录ID计数器 - 使用简单的uint256替代Counters
    uint256 private _recordIds;
    
    // 学习记录映射：记录ID => 学习记录
    mapping(uint256 => LearningRecord) public learningRecords;
    
    // 学习者的学习记录：学习者地址 => 课程ID => 记录ID
    mapping(address => mapping(uint256 => uint256)) public learnerCourseRecords;
    
    // 课程的学习者列表：课程ID => 学习者地址数组
    mapping(uint256 => address[]) public courseLearners;
    
    // NFT证书映射：课程ID => 学习者地址 => 是否已颁发
    mapping(uint256 => mapping(address => bool)) public certificatesIssued;
    
    // 测验成绩：记录ID => 成绩（0-100）
    mapping(uint256 => uint256) public quizScores;
    
    // 学习奖励比例（最高70%返还）
    uint256 public constant MAX_REWARD_PERCENTAGE = 70;
    
    // 平台代币地址
    address public platformTokenAddress;
    
    // 证书NFT合约地址
    address public certificateNFTAddress;
    
    // 事件
    event CourseEnrolled(uint256 indexed recordId, uint256 indexed courseId, address indexed learner, uint256 stakedAmount);
    event ProgressUpdated(uint256 indexed recordId, uint256 newProgress);
    event CourseCompleted(uint256 indexed recordId, uint256 indexed courseId, address indexed learner, uint256 rewardAmount);
    event CertificateIssued(uint256 indexed courseId, address indexed learner);
    event QuizSubmitted(uint256 indexed recordId, uint256 score);
    
    constructor(address _courseFactoryAddress, address _platformTokenAddress) Ownable(msg.sender) {
        require(_courseFactoryAddress != address(0), "Invalid course factory address");
        require(_platformTokenAddress != address(0), "Invalid platform token address");
        
        courseFactory = CourseFactory(_courseFactoryAddress);
        platformTokenAddress = _platformTokenAddress;
    }
    
    /**
     * @dev 设置证书NFT合约地址
     */
    function setCertificateNFTAddress(address _certificateNFTAddress) external onlyOwner {
        require(_certificateNFTAddress != address(0), "Invalid certificate NFT address");
        certificateNFTAddress = _certificateNFTAddress;
    }
    
    /**
     * @dev 学习者报名课程
     */
    function enrollCourse(uint256 courseId) external payable nonReentrant returns (uint256) {
        // 获取课程信息
        CourseFactory.Course memory course = courseFactory.getCourse(courseId);
        require(course.isActive, "Course is not active");
        
        // 检查是否已报名
        require(learnerCourseRecords[msg.sender][courseId] == 0, "Already enrolled");
        
        // 检查支付金额
        require(msg.value >= course.price, "Insufficient payment");
        
        // 创建学习记录 - 修改计数器递增逻辑
        _recordIds += 1;
        uint256 newRecordId = _recordIds;
        
        learningRecords[newRecordId] = LearningRecord({
            courseId: courseId,
            learner: msg.sender,
            stakedAmount: msg.value,
            startTime: block.timestamp,
            lastCheckpointTime: block.timestamp,
            progressPercent: 0,
            completed: false,
            isActive: true
        });
        
        // 更新映射
        learnerCourseRecords[msg.sender][courseId] = newRecordId;
        courseLearners[courseId].push(msg.sender);
        
        // 转发部分资金到课程创建者
        uint256 platformFee = (msg.value * courseFactory.platformFeeRate()) / 1000;
        uint256 creatorPayout = msg.value - platformFee;
        
        // 发送给创建者
        payable(course.creator).transfer(creatorPayout);
        
        emit CourseEnrolled(newRecordId, courseId, msg.sender, msg.value);
        
        return newRecordId;
    }
    
    /**
     * @dev 更新学习进度
     * @notice 仅由预言机或管理员调用
     */
    function updateProgress(uint256 recordId, uint256 newProgress) external onlyOwner {
        require(recordId <= _recordIds, "Record does not exist");
        require(newProgress <= 100, "Progress cannot exceed 100%");
        
        LearningRecord storage record = learningRecords[recordId];
        require(record.isActive, "Record is not active");
        require(!record.completed, "Course already completed");
        
        // 只能增加进度
        require(newProgress > record.progressPercent, "Cannot decrease progress");
        
        record.progressPercent = newProgress;
        record.lastCheckpointTime = block.timestamp;
        
        emit ProgressUpdated(recordId, newProgress);
        
        // 如果进度达到100%，标记为完成
        if (newProgress == 100) {
            completeCourse(recordId);
        }
    }
    
    /**
     * @dev 提交测验成绩
     * @notice 仅由预言机或管理员调用
     */
    function submitQuizScore(uint256 recordId, uint256 score) external onlyOwner {
        require(recordId <= _recordIds, "Record does not exist");
        require(score <= 100, "Score cannot exceed 100");
        
        LearningRecord storage record = learningRecords[recordId];
        require(record.isActive, "Record is not active");
        
        quizScores[recordId] = score;
        
        emit QuizSubmitted(recordId, score);
    }
    
    /**
     * @dev 完成课程
     */
    function completeCourse(uint256 recordId) internal {
        LearningRecord storage record = learningRecords[recordId];
        record.completed = true;
        record.progressPercent = 100;
        
        // 计算奖励
        uint256 reward = calculateReward(recordId);
        
        // 发放奖励
        if (reward > 0) {
            payable(record.learner).transfer(reward);
        }
        
        // 颁发证书
        issueCertificate(record.courseId, record.learner);
        
        emit CourseCompleted(recordId, record.courseId, record.learner, reward);
    }
    
    /**
     * @dev 计算奖励金额
     */
    function calculateReward(uint256 recordId) public view returns (uint256) {
        LearningRecord memory record = learningRecords[recordId];
        
        // 基础返还比例 - 完成度 * 最高返还比例
        uint256 baseRewardPercentage = (record.progressPercent * MAX_REWARD_PERCENTAGE) / 100;
        
        // 考虑测验成绩 - 测验分数影响10%的返还比例
        uint256 scoreBonus = 0;
        uint256 score = quizScores[recordId];
        if (score > 0) {
            scoreBonus = (score * 10) / 100; // 满分可额外获得10%返还
        }
        
        // 总返还比例
        uint256 totalRewardPercentage = baseRewardPercentage + scoreBonus;
        if (totalRewardPercentage > MAX_REWARD_PERCENTAGE) {
            totalRewardPercentage = MAX_REWARD_PERCENTAGE;
        }
        
        // 计算返还金额
        return (record.stakedAmount * totalRewardPercentage) / 100;
    }
    
    /**
     * @dev 颁发证书
     */
    function issueCertificate(uint256 courseId, address learner) internal {
        // 检查是否已颁发
        if (certificatesIssued[courseId][learner]) {
            return;
        }
        
        certificatesIssued[courseId][learner] = true;
        
        // 如果设置了证书NFT合约，铸造NFT
        if (certificateNFTAddress != address(0)) {
            // 这里应该调用NFT合约的铸造方法
            // 简化起见，仅触发事件
            emit CertificateIssued(courseId, learner);
        }
    }
    
    /**
     * @dev 获取学习记录
     */
    function getLearningRecord(uint256 recordId) external view returns (LearningRecord memory) {
        require(recordId <= _recordIds, "Record does not exist");
        return learningRecords[recordId];
    }
    
    /**
     * @dev 获取学习者的课程记录ID
     */
    function getLearnerCourseRecord(address learner, uint256 courseId) external view returns (uint256) {
        return learnerCourseRecords[learner][courseId];
    }
    
    /**
     * @dev 获取课程的所有学习者
     */
    function getCourseLearners(uint256 courseId) external view returns (address[] memory) {
        return courseLearners[courseId];
    }
    
    /**
     * @dev 检查学习者是否有特定课程的证书
     */
    function hasCertificate(uint256 courseId, address learner) external view returns (bool) {
        return certificatesIssued[courseId][learner];
    }
    
    /**
     * @dev Learn-to-Earn奖励公式
     */
    function calculateLTE(uint256 recordId) external view returns (uint256) {
        LearningRecord memory record = learningRecords[recordId];
        
        // 获取课程信息
        CourseFactory.Course memory course = courseFactory.getCourse(record.courseId);
        
        // 计算学习时长（小时）
        uint256 learningDuration = (block.timestamp - record.startTime) / 3600;
        
        // 获取测验成绩
        uint256 score = quizScores[recordId];
        
        // 课程难度系数（简化为课程时长，更复杂的逻辑可以扩展）
        uint256 difficultyCoefficent = course.duration;
        
        // 计算Learn-to-Earn奖励
        // 奖励 = (学习时长 * 测验成绩%) / 课程难度系数
        if (score == 0 || difficultyCoefficent == 0) {
            return 0;
        }
        
        return (learningDuration * score * 10**18) / (difficultyCoefficent * 100);
    }
    
    /**
     * @dev 接收ETH
     */
    receive() external payable {}
} 