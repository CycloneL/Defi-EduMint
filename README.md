This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# OpenCampus EDU测试网集成指南

本项目已集成OpenCampus EDU测试网和ZeroDev钱包，支持账户抽象和链上交互。

## 重要信息

- **网络名称**: EDU Chain Testnet
- **RPC**: https://rpc.open-campus-codex.gelato.digital
- **链ID**: 656476
- **货币符号**: EDU
- **区块链浏览器**: https://opencampus-codex.blockscout.com/
- **ZeroDev项目ID**: 9ed2eaaf-819d-4079-8bbd-698bb08461e6

## 如何连接钱包

项目支持两种连接方式：

1. **OCID登录**: 通过OpenCampus ID进行OAuth登录，会自动创建兼容EDU测试网的智能合约钱包
2. **Passkey连接**: 使用WebAuthn/Passkey创建无需私钥的钱包

连接钱包后，您可以:
- 查看钱包地址
- 签名消息
- 发送交易
- 与智能合约交互

## 如何部署智能合约

1. 复制 `blockchain/.env.example` 到 `blockchain/.env`
2. 在 `.env` 文件中填入您的部署私钥
3. 使用以下命令部署到EDU测试网:

```bash
cd blockchain
npx hardhat run scripts/deploy-edu.js --network opencampus
```

## 钱包功能

项目提供以下钱包功能：

1. **签名消息**
```javascript
const { signMessage } = useZeroDev();
const signature = await signMessage("Hello, EDU Testnet!");
```

2. **发送交易**
```javascript
const { sendTransaction } = useZeroDev();
const txHash = await sendTransaction({
  to: "0xRecipientAddress",
  value: "1000000000000000", // wei
  data: "0x" // 可选数据
});
```

3. **合约交互**
```javascript
// 示例: 与合约交互
const contractAddress = "0xYourContractAddress";
const contractABI = [...]; // 合约ABI

// 使用ethers.js
const { provider } = useZeroDev();
const contract = new ethers.Contract(contractAddress, contractABI, provider);

// 读取合约数据
const data = await contract.someViewFunction();

// 写入合约数据 (需要签名)
const { kernelClient } = useZeroDev();
const tx = await kernelClient.sendTransaction({
  to: contractAddress,
  data: contract.interface.encodeFunctionData("someWriteFunction", [param1, param2])
});
```

## 技术架构

本项目整合了以下技术:

1. **ZeroDev SDK**: 提供账户抽象功能
2. **OpenCampus OAuth (OCID)**: 实现无缝登录体验
3. **Viem/Ethers.js**: 与区块链交互
4. **Hardhat**: 智能合约开发框架

如有任何问题，请参阅官方文档:
- [OpenCampus开发文档](https://devdocs.opencampus.xyz/services/)
- [ZeroDev文档](https://docs.zerodev.app/)
