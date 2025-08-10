import React from 'react';
import { useAppSelector } from '../store/hooks';

const DebugTranslations: React.FC = () => {
  const { translations } = useAppSelector((state) => state.language);

  console.log('Debug: translations object:', translations);
  console.log('Debug: translations.forms:', translations?.forms);
  console.log('Debug: translations.forms.problemDetails:', translations?.forms?.problemDetails);

  if (!translations) {
    return <div>❌ Translations not loaded</div>;
  }

  if (!translations.forms) {
    return <div>❌ translations.forms not found</div>;
  }

  if (!translations.forms.problemDetails) {
    return <div>❌ translations.forms.problemDetails not found</div>;
  }

  return (
    <div style={{ padding: '10px', background: '#e8f5e8', border: '1px solid #4caf50', borderRadius: '4px' }}>
      <h3>✅ Translation Debug Success</h3>
      <p><strong>forms.problemDetails:</strong> {translations.forms.problemDetails}</p>
      <p><strong>complaints.registerComplaint:</strong> {translations.complaints.registerComplaint}</p>
      <p><strong>nav.dashboard:</strong> {translations.nav.dashboard}</p>
    </div>
  );
};

export default DebugTranslations;
