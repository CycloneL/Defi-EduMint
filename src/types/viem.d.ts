declare module 'viem/chains' {
  interface Chain {
    id: number;
    name: string;
    network: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: {
      default: {
        http: string[];
        webSocket?: string[];
      };
      public: {
        http: string[];
        webSocket?: string[];
      };
    };
    blockExplorers?: {
      default: {
        name: string;
        url: string;
      };
    };
    contracts?: Record<string, any>;
  }

  export const sepolia: Chain;
  export const mainnet: Chain;
  export const arbitrum: Chain;
  export const optimism: Chain;
  export const polygon: Chain;
  export const polygonMumbai: Chain;
  export const base: Chain;
  export const goerli: Chain;
} 