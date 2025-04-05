// Add global wallet state initialization on app start
useEffect(() => {
  if (typeof window === 'undefined') return;
  
  // Check if there's stored session data
  const storedData = localStorage.getItem('sessionData');
  
  if (storedData) {
    try {
      const sessionData = JSON.parse(storedData);
      
      // If session data exists and is valid, initialize global state
      if (sessionData.connected && sessionData.address) {
        console.log("Initializing global wallet state from stored session");
        
        // Set global variables
        (window as any).walletConnected = true;
        (window as any).walletAddress = sessionData.address;
        
        if (sessionData.ocid) {
          (window as any).ocid = sessionData.ocid;
        }
        
        // Dispatch event to notify components
        setTimeout(() => {
          const walletConnectedEvent = new CustomEvent('walletConnected', { 
            detail: {
              address: sessionData.address,
              ocid: sessionData.ocid,
              provider: sessionData.type,
              forceUpdate: true
            }
          });
          window.dispatchEvent(walletConnectedEvent);
        }, 1000);
      }
    } catch (e) {
      console.error("Failed to parse stored session data");
    }
  }
}, []); 