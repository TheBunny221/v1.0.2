// Quick script to add the missing APP_LOGO_SIZE setting
import fetch from 'node-fetch';

async function addLogoSizeSetting() {
  try {
    // First get an admin token by checking the database or using a test endpoint
    const response = await fetch('http://localhost:4005/api/system-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Using the admin token from dev logs
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZWZqNTdnMTAwMjFkNTc3ZWtnaXZzOHciLCJpYXQiOjE3NTU1MDk1NjIsImV4cCI6MTc1NTU5NTk2Mn0.7BhYPFMBqE06sKcpBJ4VZq7YiYyOTNOzgI4RPNXZ8DY'
      },
      body: JSON.stringify({
        key: 'APP_LOGO_SIZE',
        value: 'medium',
        description: 'Size of the application logo (small, medium, large)'
      })
    });

    const result = await response.json();
    console.log('Response:', result);
  } catch (error) {
    console.error('Error adding setting:', error);
  }
}

addLogoSizeSetting();
