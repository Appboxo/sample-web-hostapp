import { useEffect, useState, useRef } from "react";
import { AppboxoWebSDK } from "@appboxo/web-sdk";

// ============================================================================
// CONFIGURATION - Update with your miniapp URL
// ============================================================================
const CLIENT_ID = "602248"; // Replace with actual clientId
const APP_ID = "app_ovTT2l"; // Replace with actual appId
// Miniapp URL - update this to match your miniapp ngrok domain
// Miniapp is running on port 3000 with ngrok domain: summer.ngrok.dev
// For testing with real miniapp, use root path: https://summer.ngrok.dev
const MINIAPP_URL =
  process.env.REACT_APP_MINIAPP_URL || "https://summer.ngrok.dev";

function LocalStorageTestExample() {
  const [isMounted, setIsMounted] = useState(false);
  const [token, setToken] = useState<string>(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0MzgzNzQ2LCJpYXQiOjE3NjQyOTczNDYsImp0aSI6ImViOWU5MGIyMTE4NDRlOTBiOTg1NjdmZjBjYmNmNzAzIiwic3ViIjoiOTYxIiwiYXVkIjoiZXNpbS1taW5pYXBwIiwiaXNzIjoiZXNpbS1zZXJ2aWNlIn0.J_5Ac479JDjQHBqE94qmAOhiRilwK8nYmcXN2qbDt3o"
  );
  const [refreshToken, setRefreshToken] = useState<string>(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NDkwMjE0NiwiaWF0IjoxNzY0Mjk3MzQ2LCJqdGkiOiIyOWY4MWVlZjM5ZDU0ZTdhYTg1NzIwNjAyMTk4MTljZSIsInN1YiI6Ijk2MSIsImF1ZCI6ImVzaW0tbWluaWFwcCIsImlzcyI6ImVzaW0tc2VydmljZSJ9._lcISt4SUridcG7heUVTccwPswowhEDjNNjzH2p8IN0"
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);

  // Initialize SDK with onGetAuthTokens callback
  useEffect(() => {
    if (sdkRef.current) {
      return;
    }
    
    // Add message listener for custom URL fallback
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
        }
      }
    };
    
    // Add listener before SDK initialization
    window.addEventListener('message', messageListener, true);
    
    const boxoSdk = new AppboxoWebSDK({
      clientId: CLIENT_ID,
      appId: APP_ID,
      debug: true,
      isDesktop: true,
      allowedOrigins: [
        window.location.origin,
        "http://localhost:3000",
        "https://summer.ngrok.dev",
        "https://esim-telegram-web.ngrok.app",
        "*", // Allow all for testing
      ],
      // Configure auth token callback - returns tokens from user input
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

    sdkRef.current = boxoSdk;

    // Mount miniapp when container is ready
    const mountMiniapp = async () => {
      if (!containerRef.current) {
        return;
      }

      try {
        await boxoSdk.mount({
          container: containerRef.current,
          url: MINIAPP_URL,
          className: "miniapp-iframe",
        });
        
        // Ensure iframe has full size
        const iframe = containerRef.current?.querySelector("iframe");
        if (iframe) {
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.style.border = "none";
        }
        
        setIsMounted(true);
      } catch (error) {
        console.error("[HostApp] Failed to mount miniapp:", error);
      }
    };

    // Wait a bit for container to be ready
    setTimeout(() => {
      mountMiniapp();
    }, 100);

    return () => {
      // Cleanup message listener
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
        <h1 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "8px" }}>Miniapp Integration Demo</h1>
        <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
          Host application with embedded miniapp in iframe
        </p>

        {/* Status */}
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: isMounted ? "#f0f9ff" : "#fff7ed",
            border: `1px solid ${isMounted ? "#0ea5e9" : "#fb923c"}`,
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          <strong>Status:</strong> {isMounted ? "Miniapp Ready" : "Waiting for miniapp..."}
          <br />
          <strong>Miniapp URL:</strong> {MINIAPP_URL}
        </div>

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
        <div
          ref={containerRef}
          className="miniapp-container"
          style={{
            width: "100%",
            minHeight: "800px",
            height: "80vh",
            maxHeight: "1200px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "#fff",
            position: "relative",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        />

        {/* Instructions */}
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "13px",
          }}
        >
          <h4 style={{ marginTop: 0, fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Instructions</h4>
          <ol style={{ marginBottom: 0, paddingLeft: "20px", color: "#6b7280", lineHeight: "1.6" }}>
            <li>Ensure miniapp is running at: <code style={{ backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>{MINIAPP_URL}</code></li>
            <li>Enter Access Token and Refresh Token in the input fields above</li>
            <li>Click "Set Tokens" to configure authentication</li>
            <li>Miniapp will automatically request tokens via SDK when needed</li>
            <li>Check miniapp console for API calls and authentication status</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default LocalStorageTestExample;

