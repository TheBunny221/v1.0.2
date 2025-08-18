import { useEffect } from "react";
import { useSystemConfig } from "../contexts/SystemConfigContext";

export const useDocumentTitle = (pageTitle?: string) => {
  const { appName } = useSystemConfig();

  useEffect(() => {
    const title = pageTitle ? `${pageTitle} - ${appName}` : appName;
    document.title = title;
  }, [appName, pageTitle]);
};
