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

# OpenCampus EDU Testnet Integration Guide

This project has integrated OpenCampus EDU testnet and ZeroDev wallet, supporting account abstraction and on-chain interactions.

## Important Information

- **Network Name**: EDU Chain Testnet
- **RPC**: https://rpc.open-campus-codex.gelato.digital
- **Chain ID**: 656476
- **Currency Symbol**: EDU
- **Blockchain Explorer**: https://opencampus-codex.blockscout.com/
- **ZeroDev Project ID**: 9ed2eaaf-819d-4079-8bbd-698bb08461e6

## How to Connect Wallet

The project supports two connection methods:

1. **OCID Login**: Login through OpenCampus ID OAuth, which automatically creates a smart contract wallet compatible with EDU testnet
2. **Passkey Connection**: Use WebAuthn/Passkey to create a wallet without requiring private keys

After connecting your wallet, you can:
- View wallet address
- Sign messages
- Send transactions
- Interact with smart contracts

## How to Deploy Smart Contracts

1. Copy `blockchain/.env.example` to `blockchain/.env`
2. Fill in your deployment private key in the `.env` file
3. Use the following command to deploy to EDU testnet:

```bash
cd blockchain
npx hardhat run scripts/deploy-edu.js --network opencampus
```

## Wallet Features

The project provides the following wallet features:

1. **Sign Messages**
```javascript
const { signMessage } = useZeroDev();
const signature = await signMessage("Hello, EDU Testnet!");
```

2. **Send Transactions**
```javascript
const { sendTransaction } = useZeroDev();
const txHash = await sendTransaction({
  to: "0xRecipientAddress",
  value: "1000000000000000", // wei
  data: "0x" // optional data
});
```

3. **Contract Interaction**
```javascript
// Example: Interact with contracts
const contractAddress = "0xYourContractAddress";
const contractABI = [...]; // Contract ABI

// Using ethers.js
const { provider } = useZeroDev();
const contract = new ethers.Contract(contractAddress, contractABI, provider);

// Read contract data
const data = await contract.someViewFunction();

// Write contract data (requires signature)
const { kernelClient } = useZeroDev();
const tx = await kernelClient.sendTransaction({
  to: contractAddress,
  data: contract.interface.encodeFunctionData("someWriteFunction", [param1, param2])
});
```

## Technical Architecture

This project integrates the following technologies:

1. **ZeroDev SDK**: Provides account abstraction functionality
2. **OpenCampus OAuth (OCID)**: Implements seamless login experience
3. **Viem/Ethers.js**: Interacts with blockchain
4. **Hardhat**: Smart contract development framework

For any questions, please refer to the official documentation:
- [OpenCampus Developer Documentation](https://devdocs.opencampus.xyz/services/)
- [ZeroDev Documentation](https://docs.zerodev.app/)
