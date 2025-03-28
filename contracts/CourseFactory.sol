// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CourseToken.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CourseFactory
 * @dev 负责创建课程NFT和对应的课程代币
 */
contract CourseFactory is ERC721, Ownable {
    // 课程ID计数器
    uint256 private _courseIds;

    // 课程结构
    struct Course {
        uint256 id;
        string title;
        string description;
        uint256 duration; // 课程时长（小时）
        uint256 price; // 以wei为单位
        address creator;
        address courseTokenAddress;
        uint256 creationTime;
        uint256 learnersCount;
        bool isActive;
    }

    // 课程存储：课程ID => 课程结构
    mapping(uint256 => Course) public courses;
    
    // 创建者的课程列表：创作者地址 => 课程ID数组
    mapping(address => uint256[]) public creatorCourses;
    
    // NFT URI基础路径
    string private _baseTokenURI;
    
    // 平台费率（10 = 1%）
    uint256 public platformFeeRate = 100; // 10%
    
    // 平台费用接收地址
    address public feeCollector;
    
    // 行业系数 (100 = 1.00)
    mapping(string => uint256) public industryCoefficientMap;
    
    // 创作者声誉值 (100 = 1.00)
    mapping(address => uint256) public creatorReputationMap;

    // 事件
    event CourseCreated(uint256 indexed courseId, address creator, address courseTokenAddress);
    event CourseUpdated(uint256 indexed courseId);
    event CourseActivationChanged(uint256 indexed courseId, bool isActive);

    /**
     * @dev 检查课程（NFT）是否存在
     */
    function _exists(uint256 courseId) internal view returns (bool) {
        return courseId > 0 && courseId <= _courseIds && courses[courseId].creator != address(0);
    }

    constructor(address _feeCollector) ERC721("EDU Course Certificate", "EDUCERT") Ownable(msg.sender) {
        require(_feeCollector != address(0), "Invalid fee collector address");
        feeCollector = _feeCollector;
        
        // 设置一些默认行业系数
        industryCoefficientMap["technology"] = 120; // 1.20x
        industryCoefficientMap["business"] = 110; // 1.10x
        industryCoefficientMap["arts"] = 90; // 0.90x
        industryCoefficientMap["science"] = 115; // 1.15x
        
        // 所有创作者初始声誉为1.00
        creatorReputationMap[msg.sender] = 100;
    }

    /**
     * @dev 创建新课程及其对应的代币
     */
    function createCourse(
        string memory title,
        string memory description,
        uint256 duration,
        string memory industry,
        uint256 basePrice
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(duration > 0, "Duration must be greater than 0");
        require(basePrice > 0, "Base price must be greater than 0");
        
        // 计算课程价格 = 基础价格 * 课程时长 * 行业系数 * 创作者声誉
        uint256 industryCoef = industryCoefficientMap[industry];
        if (industryCoef == 0) industryCoef = 100; // 默认系数为1
        
        uint256 creatorReputation = creatorReputationMap[msg.sender];
        if (creatorReputation == 0) creatorReputation = 100; // 默认声誉为1
        
        uint256 calculatedPrice = basePrice * duration * industryCoef * creatorReputation / 1000000; // 除以10^6因为系数乘以100
        
        // 创建课程代币
        uint256 tokenSupply = 1000000 * duration; // 基础供应量 = 100万 * 课程时长
        CourseToken courseToken = new CourseToken(
            string(abi.encodePacked(title, " Token")),
            string(abi.encodePacked("CT", _courseIds)),
            tokenSupply,
            msg.sender
        );
        
        // 创建课程记录
        _courseIds += 1;
        uint256 newCourseId = _courseIds;
        
        courses[newCourseId] = Course({
            id: newCourseId,
            title: title,
            description: description,
            duration: duration,
            price: calculatedPrice,
            creator: msg.sender,
            courseTokenAddress: address(courseToken),
            creationTime: block.timestamp,
            learnersCount: 0,
            isActive: true
        });
        
        // 添加到创作者的课程列表
        creatorCourses[msg.sender].push(newCourseId);
        
        // 铸造NFT给创作者（作为课程所有权证明）
        _mint(msg.sender, newCourseId);
        
        emit CourseCreated(newCourseId, msg.sender, address(courseToken));
        
        return newCourseId;
    }
    
    /**
     * @dev 更新课程信息
     */
    function updateCourse(
        uint256 courseId,
        string memory title,
        string memory description
    ) external {
        require(_exists(courseId), "Course does not exist");
        require(courses[courseId].creator == msg.sender, "Not the course creator");
        
        Course storage course = courses[courseId];
        course.title = title;
        course.description = description;
        
        emit CourseUpdated(courseId);
    }
    
    /**
     * @dev 更改课程激活状态
     */
    function toggleCourseActivation(uint256 courseId) external {
        require(_exists(courseId), "Course does not exist");
        require(courses[courseId].creator == msg.sender, "Not the course creator");
        
        courses[courseId].isActive = !courses[courseId].isActive;
        
        emit CourseActivationChanged(courseId, courses[courseId].isActive);
    }
    
    /**
     * @dev 获取创作者的所有课程ID
     */
    function getCreatorCourses(address creator) external view returns (uint256[] memory) {
        return creatorCourses[creator];
    }
    
    /**
     * @dev 获取课程详情
     */
    function getCourse(uint256 courseId) external view returns (Course memory) {
        require(_exists(courseId), "Course does not exist");
        return courses[courseId];
    }
    
    /**
     * @dev 设置平台费率
     */
    function setPlatformFeeRate(uint256 newRate) external onlyOwner {
        require(newRate <= 300, "Fee too high"); // 最大30%
        platformFeeRate = newRate;
    }
    
    /**
     * @dev 设置行业系数
     */
    function setIndustryCoefficient(string memory industry, uint256 coefficient) external onlyOwner {
        require(coefficient > 0 && coefficient <= 300, "Invalid coefficient"); // 0-3.00x
        industryCoefficientMap[industry] = coefficient;
    }
    
    /**
     * @dev 设置创作者声誉值
     */
    function setCreatorReputation(address creator, uint256 reputation) external onlyOwner {
        require(reputation > 0 && reputation <= 300, "Invalid reputation"); // 0-3.00x
        creatorReputationMap[creator] = reputation;
    }
    
    /**
     * @dev 设置基础令牌URI
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev 返回令牌URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}