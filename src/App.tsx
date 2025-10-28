import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BoxoDesktopHostSDK } from 'boxo-desktop-host-sdk';
import './App.css';

interface LogEntry {
  time: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

function App() {
  const [sdk, setSdk] = useState<BoxoDesktopHostSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const addLog = useCallback((type: LogEntry['type'], message: string, data?: any) => {
    setLogs((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), type, message, data }
    ]);
  }, []);

  // Initialize SDK
  useEffect(() => {
    const config = {
      clientId: '602248',
      appId: 'app29296',
      baseUrl: 'https://dashboard.appboxo.com/api/v1',
      debug: true
    };

    const boxoSdk = new BoxoDesktopHostSDK(config);
    boxoSdk.setAuthCode('tNCYV57xV03Ds3ar63oQtddQxUxCRY');
    setSdk(boxoSdk);
    addLog('info', 'SDK created');

    // Listen for login responses
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'appboxo-host-response' && event.data.handler === 'AppBoxoWebAppLogin') {
        if (event.data.data?.payload?.token) {
          setIsLoggedIn(true);
          addLog('success', 'Login successful!');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      boxoSdk.destroy();
      window.removeEventListener('message', handleMessage);
    };
  }, [addLog]);

  // Initialize SDK when iframe is ready
  useEffect(() => {
    if (!sdk || !iframeRef.current || isInitialized) return;

    try {
      sdk.setIframe(iframeRef.current);
      sdk.initialize();
      setIsInitialized(true);
      addLog('success', 'SDK initialized');
    } catch (error) {
      addLog('error', 'Failed to initialize SDK', error);
    }
  }, [sdk, isInitialized, addLog]);

  const simulateEvent = (eventName: string, params: any) => {
    if (!sdk) return addLog('error', 'SDK not initialized');
    
    addLog('info', `Simulating ${eventName}...`);
    window.postMessage({ handler: eventName, params, type: 'appboxo-js-sdk', request_id: Date.now() }, '*');
  };

  const testLogin = () => simulateEvent('AppBoxoWebAppLogin', { confirmModalText: 'Please login to continue' });
  const testPayment = () => simulateEvent('AppBoxoWebAppPay', { amount: 99.99, miniappOrderId: `order-${Date.now()}`, transactionToken: `token-${Date.now()}`, currency: 'USD' });
  const testCustomEvent = () => simulateEvent('AppBoxoWebAppCustomEvent', { type: 'test-event', payload: { action: 'navigate', url: 'https://example.com', timestamp: Date.now() } });

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Boxo Desktop SDK Test</h1>
        <p className="subtitle">
          Testing <code>boxo-desktop-host-sdk</code> from npm
        </p>
      </header>

      <div className="main-container">
        {/* Left Sidebar */}
        <aside className="sidebar">
          {/* Status Card */}
          <div className="card status-card">
            <h2>SDK Status</h2>
            <div className="status-grid">
              <div className={`status-item ${sdk ? 'active' : ''}`}>
                <span className="status-label">SDK Instance</span>
                <span className="status-value">{sdk ? 'Created' : 'Not Created'}</span>
              </div>
              <div className={`status-item ${isInitialized ? 'active' : ''}`}>
                <span className="status-label">Initialized</span>
                <span className="status-value">
                  {isInitialized ? 'Ready' : 'Not Ready'}
                </span>
              </div>
              <div className={`status-item ${isLoggedIn ? 'active' : ''}`}>
                <span className="status-label">Login</span>
                <span className="status-value">
                  {isLoggedIn ? 'Logged In' : 'Not Logged In'}
                </span>
              </div>
              <div className="status-item active">
                <span className="status-label">Version</span>
                <span className="status-value">1.0.0</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="card">
            <h2>Controls</h2>
            <div className="controls">
              <button
                onClick={testLogin}
                disabled={!isInitialized}
                className="btn btn-success"
              >
                Test Login Event
              </button>
              <button
                onClick={testPayment}
                disabled={!isInitialized}
                className="btn btn-success"
              >
                Test Payment Event
              </button>
              <button
                onClick={testCustomEvent}
                disabled={!isInitialized}
                className="btn btn-info"
              >
                Test Custom Event
              </button>
              <button onClick={clearLogs} className="btn btn-danger">
                Clear Logs
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          {/* Iframe */}
          <div className="card">
            <h2>Miniapp Container</h2>
            <div className="iframe-container">
              <iframe
                ref={iframeRef}
                id="miniapp-iframe"
                src="http://localhost:3000"
                title="Miniapp"
                className="miniapp-iframe"
              />
              <div className="iframe-note">
                <p>Iframe: {iframeRef.current ? 'Ready' : 'Loading...'}</p>
                <p>SDK: {isInitialized ? 'Initialized' : 'Not initialized'}</p>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="card logs-card">
            <h2>Event Logs</h2>
            <div className="logs-container">
              {logs.length === 0 ? (
                <div className="logs-empty">No logs yet. Try initializing the SDK!</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`log-entry log-${log.type}`}>
                    <span className="log-time">[{log.time}]</span>
                    <span className="log-message">{log.message}</span>
                    {log.data && (
                      <pre className="log-data">{JSON.stringify(log.data, null, 2)}</pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
