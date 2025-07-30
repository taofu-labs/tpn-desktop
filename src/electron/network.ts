import speedTest from "speedtest-net";

export const getNetworkspeed = async () => {
  const result = await speedTest({ acceptLicense: true });
  return {
    download: result.download.bandwidth / 125000, // Mbps
    upload: result.upload.bandwidth / 125000, // Mbps
  };
};
