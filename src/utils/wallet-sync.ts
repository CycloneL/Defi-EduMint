/**
 * Wallet Synchronization Utilities
 * 
 * Functions for maintaining consistent wallet state across application components
 */

'use client';

/**
 * Synchronize wallet state after OCID authentication
 * @param address Ethereum address
 * @param oCId OCID identifier
 * @param idToken Optional OCID ID token 
 */
export function syncWalletAfterOCIDAuth(address: string, oCId: string, idToken?: string): void {
  if (!address) {
    console.error('Failed to sync wallet state: Missing address');
    return;
  }

  try {
    console.log('Synchronizing wallet state after OCID auth...');
    
    // Set global variables
    if (typeof window !== 'undefined') {
      (window as any).walletConnected = true;
      (window as any).walletAddress = address;
      (window as any).connectedWalletType = 'ocid';
      
      // Store enhanced session info with transaction capabilities flag
      const sessionData = {
        address: address,
        type: 'ocid',
        ocid: oCId,
        idToken: idToken || '',
        loginTime: new Date().toISOString(),
        transactionCapabilities: false, // Will be updated after reconnection attempt
        needsReconnect: true
      };
      
      localStorage.setItem('sessionData', JSON.stringify(sessionData));
      
      // Also set ZeroDev session to ensure sync
      localStorage.setItem('zerodev_session', JSON.stringify({
        address: address,
        type: 'ocid',
        ocid: oCId,
        loginTime: new Date().toISOString()
      }));
      
      // Store OCID token separately for reconnection attempts
      if (idToken) {
        localStorage.setItem('ocid_token', idToken);
      }
      
      // Trigger wallet connection event
      const walletConnectedEvent = new CustomEvent('walletConnected', { 
        detail: { 
          address: address,
          ocid: oCId,
          provider: "ocid",
          forceUpdate: true,
          syncAll: true
        }
      });
      
      window.dispatchEvent(walletConnectedEvent);
      
      // Trigger again after 500ms to ensure event is processed
      setTimeout(() => {
        const secondWalletConnectedEvent = new CustomEvent('walletConnected', { 
          detail: { 
            address: address,
            ocid: oCId,
            provider: "ocid",
            forceUpdate: true,
            reconnectForTransactions: true,
            syncAll: true
          }
        });
        window.dispatchEvent(secondWalletConnectedEvent);
      }, 500);
    }
  } catch (error) {
    console.error('Failed to sync wallet state:', error);
  }
}

/**
 * Synchronize ZeroDev and Web3Context states
 */
export function syncZeroDevAndWeb3Context(address: string): void {
  try {
    if (typeof window === 'undefined') return;
    
    console.log('Synchronizing ZeroDev and Web3Context states...');
    
    // Set global variables
    (window as any).walletConnected = true;
    (window as any).walletAddress = address;
    
    // Trigger wallet connection event - force update both contexts
    const walletConnectedEvent = new CustomEvent('walletConnected', { 
      detail: { 
        address: address,
        forceUpdate: true,
        syncAll: true
      }
    });
    
    window.dispatchEvent(walletConnectedEvent);
    
    console.log('ZeroDev and Web3Context states synchronized successfully');
  } catch (error) {
    console.error('Failed to synchronize ZeroDev and Web3Context states:', error);
  }
}

/**
 * Mark wallet with transaction capabilities
 */
export function markWalletWithTransactionCapabilities(address: string): void {
  try {
    console.log(`Marking wallet with transaction capabilities: ${address}`);
    
    const sessionData = localStorage.getItem('sessionData');
    if (!sessionData) {
      console.warn('No session data found to mark transaction capabilities');
      return;
    }
    
    // Parse session data
    const session = JSON.parse(sessionData);
    
    // Update transaction capabilities flag
    session.transactionCapabilities = true;
    
    // Save updated session data
    localStorage.setItem('sessionData', JSON.stringify(session));
    
    // Update global state
    (window as any).walletHasTransactionCapabilities = true;
    
    // Synchronize ZeroDev and Web3Context states to ensure consistency
    syncZeroDevAndWeb3Context(address);
    
    console.log('Wallet transaction capabilities updated successfully');
    
    // Trigger to ensure all components know the wallet now has transaction capabilities
    const walletReadyEvent = new CustomEvent('walletReady', { 
      detail: { 
        address: address,
        hasTransactionCapabilities: true
      }
    });
    window.dispatchEvent(walletReadyEvent);
    
  } catch (error) {
    console.error('Failed to mark wallet with transaction capabilities:', error);
  }
}

/**
 * Check if wallet has transaction capabilities
 */
export function hasTransactionCapabilities(): boolean {
  try {
    const sessionData = localStorage.getItem('sessionData');
    if (!sessionData) return false;
    
    const session = JSON.parse(sessionData);
    return !!session.transactionCapabilities;
  } catch (error) {
    console.error('Failed to check transaction capabilities:', error);
    return false;
  }
}

/**
 * Force reconnect wallet
 */
export function forceReconnectWallet(): void {
  try {
    // Get session data from localStorage
    const sessionData = localStorage.getItem('sessionData');
    if (!sessionData) {
      console.log('No session data found, cannot force reconnect');
      return;
    }
    
    const session = JSON.parse(sessionData);
    if (!session.address) {
      console.log('No address in session data, cannot force reconnect');
      return;
    }
    
    console.log('Force reconnecting wallet...');
    
    // Set global variables
    (window as any).walletConnected = true;
    (window as any).walletAddress = session.address;
    
    // Check if we need to trigger reconnection for transaction support
    const needsReconnect = session.type === 'ocid' && (session.needsReconnect !== false);
    
    // Trigger wallet connection event
    const walletConnectedEvent = new CustomEvent('walletConnected', { 
      detail: { 
        address: session.address,
        ocid: session.ocid || '',
        provider: session.type || "unknown",
        forceUpdate: true,
        reconnectForTransactions: needsReconnect
      }
    });
    
    window.dispatchEvent(walletConnectedEvent);
  } catch (error) {
    console.error('Failed to force reconnect wallet:', error);
  }
}

/**
 * Clear wallet connection state
 */
export function clearWalletConnection(): void {
  if (typeof window !== 'undefined') {
    // Clear global variables
    (window as any).walletConnected = false;
    (window as any).walletAddress = null;
    
    // Clear session storage
    localStorage.removeItem('sessionData');
    localStorage.removeItem('zerodev_session');
    localStorage.removeItem('ocid_token');
    
    // Trigger wallet disconnection event
    const walletDisconnectedEvent = new CustomEvent('walletDisconnected');
    window.dispatchEvent(walletDisconnectedEvent);
  }
}

/**
 * Synchronize wallet state
 */
export function syncWalletState() {
  if (typeof window === 'undefined') return;
  
  console.log('Synchronizing ZeroDev and Web3Context states...');
  
  // Read session data from localStorage
  const sessionData = localStorage.getItem('sessionData');
  if (!sessionData) return;
  
  try {
    const session = JSON.parse(sessionData);
    if (!session.address) return;
    
    // Trigger ZeroDev state update
    (window as any).zeroDevSyncEvent = {
      address: session.address,
      forceUpdate: true
    };
    
    // Trigger global state update
    (window as any).walletConnected = true;
    (window as any).walletAddress = session.address;
    
    const event = new CustomEvent('walletConnected', { 
      detail: { 
        address: session.address, 
        provider: session.type,
        syncAll: true,
        forceUpdate: true
      }
    });
    window.dispatchEvent(event);
    
    console.log('ZeroDev and Web3Context state synchronization completed');
  } catch (error) {
    console.error('Failed to synchronize wallet state:', error);
  }
}

/**
 * Get last connected account
 */
export function getLastConnectedAccount(): string | null {
  if (typeof window === 'undefined') return null;
  
  const sessionData = localStorage.getItem('sessionData');
  if (!sessionData) return null;
  
  try {
    const session = JSON.parse(sessionData);
    return session.address || null;
  } catch (error) {
    console.error('Failed to get last connected account:', error);
    return null;
  }
}

// Function to completely clean up wallet state
export function fullCleanupWalletState(): void {
  if (typeof window === 'undefined') return;
  
  // Clear global state
  (window as any).walletConnected = false;
  (window as any).walletAddress = undefined;
  (window as any).ocid = undefined;
  (window as any).ethersProvider = undefined;
  
  // Clear local storage
  localStorage.removeItem('sessionData');
  
  // Dispatch disconnect event
  const walletDisconnectedEvent = new CustomEvent('walletDisconnected');
  window.dispatchEvent(walletDisconnectedEvent);
  
  console.log("Wallet state completely cleaned up");
} 