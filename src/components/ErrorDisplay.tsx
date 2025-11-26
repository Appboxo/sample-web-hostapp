import React, { useState, useEffect } from 'react';

interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: Date;
}

export const ErrorDisplay: React.FC = () => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Catch unhandled errors
    const handleError = (event: ErrorEvent) => {
      console.error('[ErrorDisplay] Unhandled error:', event.error);
      setErrors((prev) => [
        {
          message: event.message || event.error?.message || 'Unknown error',
          stack: event.error?.stack,
          timestamp: new Date(),
        },
        ...prev.slice(0, 4), // Keep last 5 errors
      ]);
      setIsVisible(true);
    };

    // Catch unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('[ErrorDisplay] Unhandled promise rejection:', event.reason);
      setErrors((prev) => [
        {
          message: event.reason?.message || String(event.reason) || 'Promise rejection',
          stack: event.reason?.stack,
          timestamp: new Date(),
        },
        ...prev.slice(0, 4),
      ]);
      setIsVisible(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Always show button, even if no errors
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 9999,
          padding: '8px 12px',
          backgroundColor: errors.length > 0 ? '#f44336' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        🐛 Debug ({errors.length})
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        backgroundColor: '#fff',
        border: '2px solid #f44336',
        borderRadius: '8px',
        padding: '16px',
        zIndex: 10000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        overflow: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, color: '#f44336' }}>🐛 Debug Console</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0 8px',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <button
          onClick={() => setErrors([])}
          style={{
            padding: '6px 12px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            marginRight: '8px',
          }}
        >
          Clear
        </button>
        <button
          onClick={() => {
            const logs = errors.map((e) => `${e.timestamp.toLocaleTimeString()}: ${e.message}\n${e.stack || ''}`).join('\n\n');
            navigator.clipboard.writeText(logs);
            alert('Errors copied to clipboard!');
          }}
          style={{
            padding: '6px 12px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Copy All
        </button>
      </div>

      <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
        {errors.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
            <p>No errors captured yet.</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              If you see a white screen, check:
            </p>
            <ul style={{ fontSize: '11px', textAlign: 'left', marginTop: '8px' }}>
              <li>Browser console (if accessible) - Look for web-sdk debug logs</li>
              <li>Network tab for failed requests to miniapp URL</li>
              <li>Miniapp URL in the status area (should show boxo miniapp URL, not parent app)</li>
              <li>Iframe status (should show "Loaded" when miniapp loads)</li>
            </ul>
            <p style={{ fontSize: '11px', marginTop: '12px', color: '#ff9800' }}>
              💡 Tip: Open browser DevTools → Console to see web-sdk debug logs
            </p>
          </div>
        ) : (
          errors.map((error, index) => (
          <div
            key={index}
            style={{
              marginBottom: '12px',
              padding: '12px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
              {error.timestamp.toLocaleTimeString()}
            </div>
            <div style={{ fontWeight: 'bold', color: '#c00', marginBottom: '4px' }}>
              {error.message}
            </div>
            {error.stack && (
              <details style={{ marginTop: '8px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#666' }}>
                  Stack trace
                </summary>
                <pre
                  style={{
                    fontSize: '10px',
                    overflow: 'auto',
                    marginTop: '4px',
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                  }}
                >
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        ))
        )}
      </div>
    </div>
  );
};

