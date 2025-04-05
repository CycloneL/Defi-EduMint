declare module '@opencampus/ocid-connect-js' {
  export class OCAuthSandbox {
    constructor(config?: { 
      clientId?: string; 
      redirectUri?: string; 
      sandbox?: boolean;
    });
    
    signInWithRedirect(options?: { state?: string }): Promise<void>;
    handleLoginRedirect(): Promise<{
      idToken: string;
      accessToken?: string;
      name?: string;
      email?: string;
      OCId?: string;
      ethAddress?: string;
    }>;
    getAuthState(): any;
    getStateParameter(): string | null;
    logout(options?: { returnUrl?: string }): Promise<void>;
  }
  
  export class OCAuthLive {
    constructor(config: { 
      clientId: string; 
      redirectUri?: string;
    });
    
    signInWithRedirect(options?: { state?: string }): Promise<void>;
    handleLoginRedirect(): Promise<{
      idToken: string;
      accessToken?: string;
      name?: string;
      email?: string;
      OCId?: string;
      ethAddress?: string;
    }>;
    getAuthState(): any;
    getStateParameter(): string | null;
    logout(options?: { returnUrl?: string }): Promise<void>;
  }
  
  export interface OCConnectProps {
    opts?: {
      clientId?: string;
      redirectUri?: string;
      referralCode?: string;
      storageType?: 'cookie' | 'localStorage';
      domain?: string;
      sameSite?: boolean;
    };
    sandboxMode?: boolean;
    children: React.ReactNode;
  }
  
  export function OCConnect(props: OCConnectProps): JSX.Element;
  export function LoginCallBack(props: {
    errorCallback?: (error: any) => void;
    successCallback?: () => void;
    customErrorComponent?: React.ReactNode;
    customLoadingComponent?: React.ReactNode;
  }): JSX.Element;
  
  export function useOCAuth(): {
    isInitialized: boolean;
    authState: {
      isAuthenticated: boolean;
      accessToken?: string;
      idToken?: string;
      OCId?: string;
      ethAddress?: string;
      error?: {
        message: string;
      };
    };
    ocAuth: OCAuthSandbox | OCAuthLive;
    OCId?: string;
    ethAddress?: string;
  };
} 