import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetPublicSystemConfigQuery } from "../store/api/systemConfigApi";
import { getApiErrorMessage } from "../store/api/baseApi";

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

// Default configuration values to prevent null reference errors
const DEFAULT_CONFIG: SystemConfigContextType = {
  config: {
    APP_NAME: "Kochi Smart City",
    APP_LOGO_URL: "/logo.png",
    APP_LOGO_SIZE: "medium",
    COMPLAINT_ID_PREFIX: "KSC",
    COMPLAINT_ID_START_NUMBER: "1",
    COMPLAINT_ID_LENGTH: "4",
  },
  appName: "Kochi Smart City",
  appLogoUrl: "/logo.png",
  appLogoSize: "medium",
  isLoading: false,
  refreshConfig: async () => {},
  getConfig: (key: string, defaultValue: string = "") => defaultValue,
};

const SystemConfigContext = createContext<SystemConfigContextType>(DEFAULT_CONFIG);

export const useSystemConfig = () => {
  const context = useContext(SystemConfigContext);
  if (!context) {
    console.warn(
      "useSystemConfig called outside of SystemConfigProvider, using default values"
    );
    return DEFAULT_CONFIG;
  }
  return context;
};

interface SystemConfigProviderProps {
  children: React.ReactNode;
}

export const SystemConfigProvider: React.FC<SystemConfigProviderProps> = ({
  children,
}) => {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG.config);

  // Use RTK Query hook for better error handling and caching
  const {
    data: configResponse,
    isLoading,
    error,
    refetch,
  } = useGetPublicSystemConfigQuery(undefined, {
    // Additional caching options to prevent continuous fetching
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  // Process the RTK Query data when it changes
  useEffect(() => {
    if (configResponse?.success && Array.isArray(configResponse.data)) {
      const configMap: SystemConfig = {};
      configResponse.data.forEach((setting: any) => {
        configMap[setting.key] = setting.value;
      });
      setConfig(configMap);
      console.log("System config loaded successfully via RTK Query", {
        timestamp: new Date().toISOString(),
        configCount: configResponse.data.length,
      });
    } else if (error) {
      const errorMessage = getApiErrorMessage(error);
      console.error(
        "Error fetching system config via RTK Query:",
        errorMessage,
      );
      console.error("Full error details:", {
        status: 'status' in error ? error.status : 'unknown',
        data: 'data' in error ? error.data : 'unknown',
        message: 'message' in error ? error.message : 'unknown',
        error: error,
      });
      // Fallback to default values
      setConfig(DEFAULT_CONFIG.config);
    }
  }, [configResponse, error]);

  const refreshConfig = async () => {
    await refetch();
  };

  const getConfig = (key: string, defaultValue: string = "") => {
    return config[key] || defaultValue;
  };

  // RTK Query handles data fetching automatically, no manual useEffect needed

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
