import React, { createContext, useContext, useEffect, useState } from "react";

interface SystemConfig {
  [key: string]: string;
}

interface SystemConfigContextType {
  config: SystemConfig;
  appName: string;
  appLogoUrl: string;
  appLogoSize: string;
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
  getConfig: (key: string, defaultValue?: string) => string;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(
  undefined,
);

export const useSystemConfig = () => {
  const context = useContext(SystemConfigContext);
  if (context === undefined) {
    throw new Error(
      "useSystemConfig must be used within a SystemConfigProvider",
    );
  }
  return context;
};

interface SystemConfigProviderProps {
  children: React.ReactNode;
}

export const SystemConfigProvider: React.FC<SystemConfigProviderProps> = ({
  children,
}) => {
  const [config, setConfig] = useState<SystemConfig>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    try {
      // Only set loading on the first attempt
      if (retryCount === 0) {
        setIsLoading(true);
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/system-config/public", {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const configMap: SystemConfig = {};

        if (data.success && Array.isArray(data.data)) {
          data.data.forEach((setting: any) => {
            configMap[setting.key] = setting.value;
          });
        }

        setConfig(configMap);
        console.log("System config loaded successfully");
        setIsLoading(false);
        return; // Success, exit early
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error fetching system config (attempt ${retryCount + 1}):`, error);

      // Retry logic for network errors
      if (retryCount < maxRetries &&
          ((error instanceof TypeError && error.message.includes("fetch")) ||
          (error instanceof DOMException && error.name === "AbortError"))) {

        console.log(`Retrying system config fetch in ${retryDelay}ms... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          fetchConfig(retryCount + 1);
        }, retryDelay);
        return;
      }

      // Fallback to default values after all retries failed
      console.warn("All retries failed, using default system config");
      setConfig({
        APP_NAME: "Kochi Smart City",
        APP_LOGO_URL: "/logo.png",
        APP_LOGO_SIZE: "medium",
        COMPLAINT_ID_PREFIX: "KSC",
        COMPLAINT_ID_START_NUMBER: "1",
        COMPLAINT_ID_LENGTH: "4",
      });
      setIsLoading(false);
    }
  };

  const refreshConfig = async () => {
    await fetchConfig();
  };

  const getConfig = (key: string, defaultValue: string = "") => {
    return config[key] || defaultValue;
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const appName = getConfig("APP_NAME", "Kochi Smart City");
  const appLogoUrl = getConfig("APP_LOGO_URL", "/logo.png");
  const appLogoSize = getConfig("APP_LOGO_SIZE", "medium");

  const value: SystemConfigContextType = {
    config,
    appName,
    appLogoUrl,
    appLogoSize,
    isLoading,
    refreshConfig,
    getConfig,
  };

  return (
    <SystemConfigContext.Provider value={value}>
      {children}
    </SystemConfigContext.Provider>
  );
};
