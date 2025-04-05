// 这个文件帮助TypeScript理解ZeroDev SDK v5的类型

/**
 * ZeroDev SDK v5类型补充
 * 
 * 注意：这些类型定义仅用于协助TypeScript理解项目中使用的类型
 * 实际类型定义应该来自@zerodev/sdk本身
 */

declare module '@zerodev/sdk' {
  import { 
    Address,
    Chain,
    Hash,
    Hex,
    Transport,
    Account,
    WalletClient,
    PublicClient,
    TypedData,
    TypedDataDefinition
  } from 'viem';

  // 消息签名参数
  export interface SignMessageParameters {
    message: string | Uint8Array;
  }

  // 类型化数据签名参数（简化版本，实际可能更复杂）
  export interface SignTypedDataParameters {
    domain: Record<string, any>;
    types: Record<string, Array<{name: string; type: string}>>;
    primaryType: string;
    message: Record<string, any>;
  }

  // 签名者接口
  export interface CustomSigner {
    signMessage: (params: SignMessageParameters) => Promise<Hex>;
    signTypedData: (params: SignTypedDataParameters) => Promise<Hex>;
    getAddress: () => Promise<Address>;
  }

  // Passkey账户配置
  export interface PasskeyAccountConfig {
    type: 'passkey';
    passkeyName?: string;
  }

  // 简单账户配置
  export interface SimpleAccountConfig {
    type: 'simple';
    signer: CustomSigner;
  }

  // 账户配置联合类型
  export type AccountConfig = PasskeyAccountConfig | SimpleAccountConfig;

  // 创建内核账户客户端配置
  export interface CreateKernelAccountClientConfig {
    chain: Chain;
    projectId: string;
    accountConfig?: AccountConfig;
  }

  // 创建内核账户客户端
  export function createKernelAccountClient(
    config: CreateKernelAccountClientConfig
  ): Promise<any>;

  // 创建ZeroDev支付主客户端
  export function createZeroDevPaymasterClient(): any;

  export interface KernelAccountClient {
    account: {
      address: Address;
    };
    sendTransaction: (tx: any) => Promise<string>;
    sendTransactions: (txs: any[]) => Promise<string>;
    signMessage: (message: string | Uint8Array) => Promise<string>;
    signTypedData: (typedData: any) => Promise<string>;
    deployContract: (args: any) => Promise<Address>;
    // 其他可能的方法...
  }
  
  export type VerificationMethodType = 'passkey' | 'oauth' | 'ecdsa';
  
  export interface PasskeyOptions {
    projectId: string;
    viemClient: PublicClient;
    verificationMethodType: 'passkey';
  }
  
  export interface OAuthOptions {
    projectId: string;
    viemClient: PublicClient;
    verificationMethodType: 'oauth';
    idToken: string;
    provider: string;
  }
  
  export interface ECDSAOptions {
    projectId: string;
    viemClient: PublicClient;
    verificationMethodType: 'ecdsa';
    privateKey?: string;
  }
  
  export type KernelAccountClientOptions = PasskeyOptions | OAuthOptions | ECDSAOptions;
  
  export function createKernelAccountClient(options: KernelAccountClientOptions): Promise<KernelAccountClient>;
} 