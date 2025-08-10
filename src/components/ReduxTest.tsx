import React from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setLanguage } from '../store/slices/languageSlice';
import { showSuccessToast } from '../store/slices/uiSlice';

const ReduxTest: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentLanguage, translations } = useAppSelector((state) => state.language);
  const { toasts } = useAppSelector((state) => state.ui);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleLanguageChange = () => {
    const nextLanguage = currentLanguage === 'en' ? 'hi' : currentLanguage === 'hi' ? 'ml' : 'en';
    dispatch(setLanguage(nextLanguage));
  };

  const handleShowToast = () => {
    dispatch(showSuccessToast('Redux Test', 'Redux Toolkit is working!'));
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Redux Toolkit Test</h2>
      
      <div className="space-y-4">
        <div>
          <p><strong>Current Language:</strong> {currentLanguage}</p>
          <p><strong>Sample Translation:</strong> {translations.nav.home}</p>
          <button 
            onClick={handleLanguageChange}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Change Language
          </button>
        </div>

        <div>
          <p><strong>Authentication Status:</strong> {isAuthenticated ? 'Logged In' : 'Not Logged In'}</p>
          <p><strong>User:</strong> {user ? user.name : 'None'}</p>
        </div>

        <div>
          <p><strong>Toasts Count:</strong> {toasts.length}</p>
          <button 
            onClick={handleShowToast}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Show Test Toast
          </button>
        </div>

        <div>
          <h3 className="font-semibold">Active Toasts:</h3>
          {toasts.map(toast => (
            <div key={toast.id} className="p-2 bg-gray-100 rounded mt-1">
              <strong>{toast.title}:</strong> {toast.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReduxTest;
