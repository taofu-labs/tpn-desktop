interface SpeedTestResult {
  download: number; // Mbps
  upload: number;   // Mbps
}


export const measureNetworkSpeed = async (): Promise<SpeedTestResult> => {
  const testFileSize = 10 * 1024 * 1024; // 10MB test file
  const testUrl = 'https://speed.cloudflare.com/__down?bytes=' + testFileSize;
  
  try {
    // Measure download speed
    const downloadStart = performance.now();
    const downloadResponse = await fetch(testUrl);
    await downloadResponse.blob(); 
    const downloadEnd = performance.now();
    
    const downloadTime = (downloadEnd - downloadStart) / 1000; // seconds
    const downloadSpeed = (testFileSize * 8) / (downloadTime * 1000000); // Mbps
    
    // Measure upload speed 
    const uploadData = new Blob(['x'.repeat(1024 * 1024)]); // 1MB upload test
    const uploadStart = performance.now();
    await fetch('https://httpbin.org/post', {
      method: 'POST',
      body: uploadData,
    });
    const uploadEnd = performance.now();
    
    const uploadTime = (uploadEnd - uploadStart) / 1000; // seconds
    const uploadSpeed = (uploadData.size * 8) / (uploadTime * 1000000); // Mbps
    
    return {
      download: Math.round(downloadSpeed * 100) / 100,
      upload: Math.round(uploadSpeed * 100) / 100
    };
  } catch (error) {
    console.error('Speed test failed:', error);
    return {
      download: 0,
      upload: 0
    };
  }
};

// Continuous speed monitoring
export const startSpeedMonitoring = (
  onSpeedUpdate: (speeds: SpeedTestResult) => void,
  intervalMs: number = 30000 // 30 seconds
): (() => void) => {
  let isRunning = true;
  
  const measureAndUpdate = async () => {
    if (!isRunning) return;
    
    const speeds = await measureNetworkSpeed();
    onSpeedUpdate(speeds);
    
    if (isRunning) {
      setTimeout(measureAndUpdate, intervalMs);
    }
  };
  
  measureAndUpdate();
  
  return () => {
    isRunning = false;
  };
}; 