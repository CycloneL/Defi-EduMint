'use client'

import { ReactNode } from 'react';
import { OCConnect } from '@opencampus/ocid-connect-js';

interface OCConnectWrapperProps {
  children: ReactNode;
}

export default function OCConnectWrapper({ children }: OCConnectWrapperProps) {
  const opts = {
    // 在沙盒模式下clientId不重要
    clientId: 'opencampus',
    redirectUri: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
    referralCode: 'PARTNER6', // 合作伙伴代码
  };

  return (
    <OCConnect opts={opts} sandboxMode={true}>
      {children}
    </OCConnect>
  );
} 