import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { loginWithToken } from '@/store/slices/authSlice';
import { initializeLanguage } from '@/store/slices/languageSlice';
import { initializeTheme, setOnlineStatus } from '@/store/slices/uiSlice';

const AppInitializer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize theme
    dispatch(initializeTheme());

    // Initialize language
    dispatch(initializeLanguage());

    // Check for existing token and login automatically
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(loginWithToken(token));
    }

    // Setup online/offline listeners
    const handleOnline = () => dispatch(setOnlineStatus(true));
    const handleOffline = () => dispatch(setOnlineStatus(false));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  return null; // This component doesn't render anything
};

export default AppInitializer;
