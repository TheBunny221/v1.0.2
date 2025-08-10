import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1>🏛️ CitizenConnect - Test Mode</h1>
      <p>If you can see this, React is working correctly!</p>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>✅ Application Status</h2>
        <ul>
          <li>✅ React is loading</li>
          <li>✅ TypeScript is working</li>
          <li>✅ Components are rendering</li>
          <li>🔄 Database connection needed</li>
        </ul>
      </div>
    </div>
  );
};

export default TestComponent;
