// src/pages/basic-test.tsx
export default function BasicTestPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Basic Test Page</h1>
      <p>If you can see this page, the Next.js server is working correctly.</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <p><strong>Environment Variables:</strong></p>
        <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}</p>
      </div>
    </div>
  );
}