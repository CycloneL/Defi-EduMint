const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 部署平台代币
  const EDUToken = await hre.ethers.getContractFactory("EDUToken");
  const eduToken = await EDUToken.deploy(
    "EDU Token",
    "EDU",
    hre.ethers.utils.parseEther("1000000") // 1,000,000 EDU初始供应
  );
  await eduToken.deployed();
  console.log("EDUToken deployed to:", eduToken.address);

  // 部署课程工厂
  const CourseFactory = await hre.ethers.getContractFactory("CourseFactory");
  const courseFactory = await CourseFactory.deploy(deployer.address);
  await courseFactory.deployed();
  console.log("CourseFactory deployed to:", courseFactory.address);

  // 部署学习管理器
  const LearningManager = await hre.ethers.getContractFactory("LearningManager");
  const learningManager = await LearningManager.deploy(
    courseFactory.address,
    eduToken.address
  );
  await learningManager.deployed();
  console.log("LearningManager deployed to:", learningManager.address);

  // 保存合约地址到前端配置文件
  const contractAddresses = {
    eduToken: eduToken.address,
    courseFactory: courseFactory.address,
    learningManager: learningManager.address,
  };

  // 保存合约ABI到前端
  const contractsDir = path.join(__dirname, "../src/contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // 保存地址
  fs.writeFileSync(
    path.join(contractsDir, "contract-addresses.json"),
    JSON.stringify(contractAddresses, null, 2)
  );

  // 保存ABIs
  const EDUTokenArtifact = artifacts.readArtifactSync("EDUToken");
  fs.writeFileSync(
    path.join(contractsDir, "EDUToken.json"),
    JSON.stringify(EDUTokenArtifact, null, 2)
  );

  const CourseFactoryArtifact = artifacts.readArtifactSync("CourseFactory");
  fs.writeFileSync(
    path.join(contractsDir, "CourseFactory.json"),
    JSON.stringify(CourseFactoryArtifact, null, 2)
  );

  const LearningManagerArtifact = artifacts.readArtifactSync("LearningManager");
  fs.writeFileSync(
    path.join(contractsDir, "LearningManager.json"),
    JSON.stringify(LearningManagerArtifact, null, 2)
  );

  console.log("合约部署完成，前端配置已更新");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 