import React, { createContext, useContext, useEffect, useState } from 'react';

interface SystemConfig {
  [key: string]: string;
}

interface SystemConfigContextType {
  config: SystemConfig;
  appName: string;
  appLogoUrl: string;
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
  getConfig: (key: string, defaultValue?: string) => string;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

export const useSystemConfig = () => {
  const context = useContext(SystemConfigContext);
  if (context === undefined) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
};

interface SystemConfigProviderProps {
  children: React.ReactNode;
}

export const SystemConfigProvider: React.FC<SystemConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/system-config/public');
      
      if (response.ok) {
        const data = await response.json();
        const configMap: SystemConfig = {};
        
        if (data.success && Array.isArray(data.data)) {
          data.data.forEach((setting: any) => {
            configMap[setting.key] = setting.value;
          });
        }
        
        setConfig(configMap);
      } else {
        // Fallback to default values if API fails
        console.warn('Failed to load system config, using defaults');
        setConfig({
          APP_NAME: 'Kochi Smart City',
          APP_LOGO_URL: '/logo.png',
          COMPLAINT_ID_PREFIX: 'KSC',
          COMPLAINT_ID_START_NUMBER: '1',
          COMPLAINT_ID_LENGTH: '4',
        });
      }
    } catch (error) {
      console.error('Error fetching system config:', error);
      // Fallback to default values
      setConfig({
        APP_NAME: 'Kochi Smart City',
        APP_LOGO_URL: '/logo.png',
        COMPLAINT_ID_PREFIX: 'KSC',
        COMPLAINT_ID_START_NUMBER: '1',
        COMPLAINT_ID_LENGTH: '4',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshConfig = async () => {
    await fetchConfig();
  };

  const getConfig = (key: string, defaultValue: string = '') => {
    return config[key] || defaultValue;
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const appName = getConfig('APP_NAME', 'Kochi Smart City');
  const appLogoUrl = getConfig('APP_LOGO_URL', '/logo.png');

  const value: SystemConfigContextType = {
    config,
    appName,
    appLogoUrl,
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
