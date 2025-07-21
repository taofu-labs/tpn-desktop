interface LeaseInfo {
  endTime: Date;
  minutesRemaining: number;
  autoDisconnect: boolean;
}

interface ConnectionState {
  connected: boolean;
  leaseInfo: LeaseInfo | null;
  currentIP: string;
}

// hooks/useLeaseManager.ts
import { useState, useEffect, useCallback, useRef } from 'react';

export const useLeaseManager = (
  initialConnectionInfo: ConnectionInfo | null,
  onDisconnect: () => Promise<void>
) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);
  const isDisconnectingRef = useRef(false);

  // Calculate remaining seconds from lease info
  const calculateRemainingSeconds = useCallback((leaseInfo: ConnectionInfo) => {
    if (!leaseInfo.leaseEndTime) return 0;
    
    const now = new Date();
    const endTime = new Date(leaseInfo.leaseEndTime);
    const diffMs = endTime.getTime() - now.getTime();
    
    return Math.max(0, Math.floor(diffMs / 1000));
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (statusCheckRef.current) {
      clearInterval(statusCheckRef.current);
      statusCheckRef.current = null;
    }
  }, []);

  // Auto-disconnect when lease expires
  const handleExpiration = useCallback(async () => {
    if (isDisconnectingRef.current) return;
    
    console.log('VPN lease expired, auto-disconnecting...');
    isDisconnectingRef.current = true;
    setIsExpired(true);
    
    try {
      await onDisconnect();
    } catch (error) {
      console.error('Auto-disconnect failed:', error);
    } finally {
      isDisconnectingRef.current = false;
    }
  }, [onDisconnect]);

  // Periodic status verification (less frequent)
  const startStatusVerification = useCallback(() => {
    statusCheckRef.current = setInterval(async () => {
      try {
        const status = await window.electron.checkStatus();
        
        // If server says we're disconnected but we think we're connected
        if (!status.connected && remainingSeconds > 0) {
          console.log('Server reports disconnection, updating local state');
          await handleExpiration();
        }
        
        // If lease time differs significantly from our countdown, resync
        if (status.connected && status.minutesRemaining !== undefined) {
          const serverSeconds = status.minutesRemaining * 60;
          const timeDiff = Math.abs(serverSeconds - remainingSeconds);
          
          if (timeDiff > 60) { // More than 1 minute difference
            console.log('Resyncing lease time with server');
            setRemainingSeconds(serverSeconds);
          }
        }
      } catch (error) {
        console.error('Status verification failed:', error);
      }
    }, 120000); // Check every 2 minutes
  }, [remainingSeconds, handleExpiration]);

  // Main countdown timer
  const startCountdown = useCallback((initialSeconds: number) => {
    setRemainingSeconds(initialSeconds);
    setIsExpired(false);
    
    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        const newValue = prev - 1;
        
        // Auto-disconnect when countdown reaches 0
        if (newValue <= 0) {
          handleExpiration();
          return 0;
        }
        
        return newValue;
      });
    }, 1000);
  }, [handleExpiration]);

  // Initialize or update lease management
  useEffect(() => {
    cleanup(); // Clear any existing timers
    
    if (initialConnectionInfo?.connected && initialConnectionInfo.leaseEndTime) {
      const seconds = calculateRemainingSeconds(initialConnectionInfo);
      
      if (seconds <= 0) {
        // Already expired
        handleExpiration();
      } else {
        startCountdown(seconds);
        startStatusVerification();
      }
    }
    
    return cleanup;
  }, [initialConnectionInfo, calculateRemainingSeconds, startCountdown, startStatusVerification, handleExpiration, cleanup]);

  // Format time for display
  const formatTime = useCallback(() => {
    if (remainingSeconds <= 0) return "Disconnecting...";
    
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    
    return `${hours}H : ${minutes.toString().padStart(2, '0')}M : ${seconds.toString().padStart(2, '0')}S`;
  }, [remainingSeconds]);

  return {
    remainingSeconds,
    formattedTime: formatTime(),
    isExpired,
    cleanup
  };
};