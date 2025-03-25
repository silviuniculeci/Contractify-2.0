import React from 'react';

export default function TestPage() {
  console.log('TestPage component rendering');

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '40px auto', 
      backgroundColor: 'yellow',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      borderRadius: '8px' 
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        Test Page
      </h1>
      <p style={{ marginBottom: '16px' }}>
        This is a standalone test page to verify routing is working.
      </p>
    </div>
  );
} 