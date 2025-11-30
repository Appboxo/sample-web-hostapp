import { useEffect, useState, useRef, useCallback } from "react";
import { AppboxoWebSDK } from "@appboxo/web-sdk";

// ============================================================================
// CONFIGURATION - Update with your miniapp URL
// ============================================================================
const CLIENT_ID = "602248"; // Replace with actual clientId
const APP_ID = "app_ovTT2l"; // Replace with actual appId
// Miniapp URL - fixed to summer.ngrok.dev (port 3000)
// Host app runs on sample-web-hostapp.ngrok.app (port 3001)
// Miniapp runs separately on summer.ngrok.dev (port 3000)
const MINIAPP_URL =
  process.env.REACT_APP_MINIAPP_URL || "https://summer.ngrok.dev";

function LocalStorageTestExample() {
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0NTc4ODAwLCJpYXQiOjE3NjQ0OTI0MDAsImp0aSI6IjdlN2ZkNjNhNmQ2MjRmYTNhMjFjZmMxYjQ0ZGE5ZGI0Iiwic3ViIjoiOTYxIiwiYXVkIjoiZXNpbS1taW5pYXBwIiwiaXNzIjoiZXNpbS1zZXJ2aWNlIn0.2L1S-kbUKaHTOTe_PHOACtgG2yvuAQPm3MVUuHOabFQ"
  );
  const [refreshToken, setRefreshToken] = useState<string>(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NTA5NzIwMCwiaWF0IjoxNzY0NDkyNDAwLCJqdGkiOiJmMjgyZDViNzE4Mjc0NTc4ODIyMjM2ZmM1Mzg3NWVkYiIsInN1YiI6Ijk2MSIsImF1ZCI6ImVzaW0tbWluaWFwcCIsImlzcyI6ImVzaW0tc2VydmljZSJ9.4YklSesKxZ57I-9HLy-FCbbHphaDKb0qXnWWA80boTk"
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);
  const initRef = useRef(false); // Guard to prevent duplicate SDK initialization
  
  // Debug logs for visible display (Telegram WebView)
  const [debugLogs, setDebugLogs] = useState<Array<{
    time: string;
    message: string;
    type: 'info' | 'success' | 'error';
    data?: any;
  }>>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  const addDebugLog = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info', data?: any) => {
    const time = new Date().toLocaleTimeString();
    const logEntry = { time, message, type, data };
    setDebugLogs((prev) => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 logs
    console.log(`[HostApp] ${message}`, data || '');
  }, []);

  useEffect(() => {
    // Prevent SDK from being created multiple times (React Strict Mode guard)
    if (initRef.current) {
      return;
    }
    initRef.current = true;
    
    // Add message listener for manual response handling
    const messageListener = (event: MessageEvent) => {
      const eventData = event.data;
      
      // Check if this is an Appboxo SDK message
      const isAppboxoSdkMessage = eventData && typeof eventData === 'object' && 
        (eventData.type === 'appboxo-js-sdk' || eventData.handler);
      
      if (isAppboxoSdkMessage) {
        const handler = eventData.handler || 'unknown';
        
        if (handler === 'AppBoxoWebAppGetInitData') {
          // If SDK doesn't respond, manually send a response after a short delay
          setTimeout(() => {
            const iframe = containerRef.current?.querySelector("iframe");
            if (iframe?.contentWindow) {
              const response = {
                type: 'appboxo-host-response',
                handler: 'AppBoxoWebAppGetInitData',
                data: {
                  app_id: APP_ID,
                  client_id: CLIENT_ID,
                  payload: '',
                  data: {
                    handlers: ['AppBoxoWebAppLogin', 'AppBoxoWebAppGetInitData'],
                    capabilities: ['AppBoxoWebAppLogin', 'AppBoxoWebAppGetInitData'],
                  },
                  sandbox_mode: false,
                },
                request_id: eventData.request_id,
              };
              
              iframe.contentWindow.postMessage(response, '*');
            }
          }, 100);
        } else if (handler === 'AppBoxoWebAppGetSystemInfo') {
          // Immediately send a response for AppBoxoWebAppGetSystemInfo (don't wait for SDK)
          const iframe = containerRef.current?.querySelector("iframe");
          if (iframe?.contentWindow) {
            const response = {
              type: 'appboxo-host-response',
              handler: 'AppBoxoWebAppGetSystemInfo',
              data: {
                model: 'iPhone',
                brand: 'Apple',
                platform: 'iOS',
                SDKVersion: '1.0.0',
                isSupportESim: true,
              },
              request_id: eventData.request_id,
            };
            
            // Send immediately, before SDK processes it
            iframe.contentWindow.postMessage(response, '*');
            // Stop propagation to prevent SDK from handling it
            event.stopImmediatePropagation();
          }
        }
      }
    };
    
    // Add listener before SDK initialization (capture phase)
    window.addEventListener('message', messageListener, true);
    
    const boxoSdk = new AppboxoWebSDK({
      clientId: CLIENT_ID,
      appId: APP_ID,
      debug: false,
      isDesktop: true,
      allowedOrigins: [
        window.location.origin,
        new URL(MINIAPP_URL).origin,
        "http://localhost:3000",
        "https://summer.ngrok.dev",
        "*",
      ],
      onGetAuthTokens: async () => {
        if (token.trim() && refreshToken.trim()) {
          return {
            token: token.trim(),
            refresh_token: refreshToken.trim(),
          };
        } else {
          return {
            token: "",
            refresh_token: "",
          };
        }
      },
    });

    boxoSdk.onLoginComplete((success: boolean, data?: any) => {
      console.log("[Auth] Login complete:", success, data);
    });

    sdkRef.current = boxoSdk;

    const mountMiniapp = async () => {
      if (!containerRef.current) {
        console.error("[LocalStorageTest] Container not ready");
        return;
      }
      try {
        setError(null);
        await boxoSdk.mount({
          container: containerRef.current,
          url: MINIAPP_URL,
          className: "miniapp-iframe",
        });
        setIsMounted(true);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("[LocalStorageTest] Mount error:", errorMsg);
        setError(errorMsg);
      }
    };

    // Wait a bit for container to be ready (keep setTimeout for safety)
    setTimeout(() => {
      mountMiniapp();
    }, 100);

    return () => {
      boxoSdk.destroy();
      window.removeEventListener('message', messageListener, true);
    };
  }, [token, refreshToken]); // Re-initialize if tokens change


  const sendToken = () => {
    if (!token.trim()) {
      alert("Please enter a token first");
      return;
    }

    if (!refreshToken.trim()) {
      alert("Please enter a refreshToken");
      return;
    }
  };

  return (
    <div className="App" style={{ padding: "20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "8px" }}>Custom URL - Miniapp Container</h1>
        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "10px",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "4px",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Token Input */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "16px", fontWeight: "600" }}>Authentication Tokens</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "bold", color: "#333" }}>
                Access Token:
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your access token here..."
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "14px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "bold", color: "#333" }}>
                Refresh Token:
              </label>
              <input
                type="text"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                placeholder="Enter your refresh token here..."
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "14px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                }}
              />
            </div>
            <button
              onClick={sendToken}
              disabled={!isMounted || !token.trim() || !refreshToken.trim()}
              style={{
                padding: "10px 16px",
                backgroundColor: isMounted && token.trim() && refreshToken.trim() ? "#2563eb" : "#9ca3af",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isMounted && token.trim() && refreshToken.trim() ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "500",
                width: "100%",
              }}
            >
              Set Tokens
            </button>
          </div>
          <p style={{ marginTop: "12px", marginBottom: 0, fontSize: "13px", color: "#6b7280" }}>
            Enter both access token and refresh token. The miniapp will request them via SDK when needed.
          </p>
        </div>

        {/* Miniapp Container (SDK will create iframe here) */}
        <div className="iframe-container">
          <div ref={containerRef} className="miniapp-container" />
          <div className="iframe-note">
            <p>Status: {isMounted ? "Mounted" : "Mounting..."}</p>
            <p>SDK: {sdkRef.current ? "Ready" : "Initializing"}</p>
            <p>URL: {MINIAPP_URL}</p>
          </div>
        </div>

        {/* Debug Panel - Optional, hidden by default */}
        {showDebugPanel && debugLogs.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "6px",
              color: "#f3f4f6",
              fontSize: "12px",
              fontFamily: "monospace",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#60a5fa" }}>
                Debug Logs
              </h4>
              <button
                onClick={() => setShowDebugPanel(false)}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#374151",
                  color: "#f3f4f6",
                  border: "1px solid #4b5563",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                Hide
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {debugLogs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    padding: "8px",
                    backgroundColor: log.type === 'error' ? '#7f1d1d' : 
                                     log.type === 'success' ? '#14532d' : '#1f2937',
                    borderLeft: `3px solid ${
                      log.type === 'error' ? '#ef4444' : 
                      log.type === 'success' ? '#22c55e' : '#6b7280'
                    }`,
                    borderRadius: "4px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ color: "#9ca3af", fontSize: "10px" }}>{log.time}</span>
                    <span style={{ 
                      color: log.type === 'error' ? '#ef4444' : 
                             log.type === 'success' ? '#22c55e' : '#9ca3af',
                      fontSize: "10px",
                      fontWeight: "600"
                    }}>
                      {log.type.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ color: "#f3f4f6" }}>
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default LocalStorageTestExample;

