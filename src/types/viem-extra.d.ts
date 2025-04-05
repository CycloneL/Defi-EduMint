// 为viem的子模块提供类型声明，解决导入问题

declare module 'viem/accounts' {
  // 基本类型声明，让TypeScript识别这个模块
  export const toAccount: any;
  export const privateKeyToAccount: any;
  export const mnemonicToAccount: any;
  export const hdKeyToAccount: any;
  export const toHex: any;
}

declare module 'viem/actions' {
  // 基本类型声明，让TypeScript识别这个模块  
  export const getBalance: any;
  export const getBlock: any;
  export const getBlockNumber: any;
  export const getChainId: any;
  export const getCode: any;
  export const getContractCode: any;
  export const getContractStorage: any;
  export const getFeeHistory: any;
  export const getGasPrice: any;
  export const getStorageAt: any;
  export const getTransaction: any;
  export const getTransactionCount: any;
  export const getTransactionReceipt: any;
  export const call: any;
  export const createBlockFilter: any;
  export const createContractEventFilter: any;
  export const createEventFilter: any;
  export const createPendingTransactionFilter: any;
  export const estimateGas: any;
  export const getLogs: any;
  export const getFilterChanges: any;
  export const getFilterLogs: any;
  export const readContract: any;
  export const simulateContract: any;
  export const uninstallFilter: any;
  export const waitForTransactionReceipt: any;
  export const watchBlockNumber: any;
  export const watchBlocks: any;
  export const watchContractEvent: any;
  export const watchEvent: any;
  export const watchPendingTransactions: any;
}

declare module 'viem/utils' {
  // 基本类型声明，让TypeScript识别这个模块
  export const hexToString: any;
  export const stringToHex: any;
  export const hexToBytes: any;
  export const bytesToHex: any;
  export const hexToNumber: any;
  export const numberToHex: any;
  export const formatEther: any;
  export const parseEther: any;
  export const formatGwei: any;
  export const parseGwei: any;
  export const formatUnits: any;
  export const parseUnits: any;
  export const encodeAbiParameters: any;
  export const decodeAbiParameters: any;
  export const parseAbiParameters: any;
  export const encodeFunctionData: any;
  export const decodeFunctionData: any;
  export const encodeFunctionResult: any;
  export const decodeFunctionResult: any;
  export const encodeEventTopics: any;
  export const decodeEventLog: any;
  export const getEventSelector: any;
  export const getFunctionSelector: any;
}

declare module 'viem/account-abstraction' {
  // 基本类型声明，让TypeScript识别这个模块
  export const createSmartAccountClient: any;
  export const createAccountClient: any;
  export const signTypedData: any;
  export const signMessage: any;
  export const sendTransaction: any;
  export const sendUserOperation: any;
  export const prepareUserOperationRequest: any;
  export const signUserOperationHash: any;
  export const getUserOperationHash: any;
  export const createUserOperationHashStruct: any;
  export const prepareUserOperationRequest: any;
} 