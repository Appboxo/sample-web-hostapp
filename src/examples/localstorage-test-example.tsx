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
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0MzgzNzQ2LCJpYXQiOjE3NjQyOTczNDYsImp0aSI6ImViOWU5MGIyMTE4NDRlOTBiOTg1NjdmZjBjYmNmNzAzIiwic3ViIjoiOTYxIiwiYXVkIjoiZXNpbS1taW5pYXBwIiwiaXNzIjoiZXNpbS1zZXJ2aWNlIn0.J_5Ac479JDjQHBqE94qmAOhiRilwK8nYmcXN2qbDt3o"
  );
  const [refreshToken, setRefreshToken] = useState<string>(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NDkwMjE0NiwiaWF0IjoxNzY0Mjk3MzQ2LCJqdGkiOiIyOWY4MWVlZjM5ZDU0ZTdhYTg1NzIwNjAyMTk4MTljZSIsInN1YiI6Ijk2MSIsImF1ZCI6ImVzaW0tbWluaWFwcCIsImlzcyI6ImVzaW0tc2VydmljZSJ9._lcISt4SUridcG7heUVTccwPswowhEDjNNjzH2p8IN0"
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);
  const initRef = useRef(false); // Guard to prevent duplicate SDK initialization

  useEffect(() => {
    // Prevent SDK from being created multiple times (React Strict Mode guard)
    if (initRef.current) {
      return;
    }
    initRef.current = true;
    
    // Add message listener for custom URL fallback
    const messageListener = (event: MessageEvent) => {
      const eventData = event.data;
      
      // Check if this is an Appboxo SDK message
      const isAppboxoSdkMessage = eventData && typeof eventData === 'object' && 
        (eventData.type === 'appboxo-js-sdk' || eventData.handler);
      
      if (isAppboxoSdkMessage) {
        const handler = eventData.handler || 'unknown';
        console.log("[LocalStorageTest] Received SDK message:", handler, eventData);
        
        if (handler === 'AppBoxoWebAppGetInitData') {
          console.log("[LocalStorageTest] Handling AppBoxoWebAppGetInitData request");
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
              console.log("[LocalStorageTest] Sending InitData response:", response);
              iframe.contentWindow.postMessage(response, '*');
            } else {
              console.warn("[LocalStorageTest] Iframe not found when trying to send InitData");
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
      debug: true, // Enable debug to see SDK messages
      isDesktop: true,
      allowedOrigins: [], // Set `allowedOrigins` → restrict to specific domains
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
        console.log("[LocalStorageTest] Mounting miniapp at:", MINIAPP_URL);
        await boxoSdk.mount({
          container: containerRef.current,
          url: MINIAPP_URL, // Custom URL - key difference from other examples
          className: "miniapp-iframe",
        });
        console.log("[LocalStorageTest] Miniapp mounted successfully");
        setIsMounted(true);
        
        // Check iframe after mount
        setTimeout(() => {
          const iframe = containerRef.current?.querySelector("iframe");
          if (iframe) {
            console.log("[LocalStorageTest] Iframe found, src:", iframe.src);
            iframe.onload = () => {
              console.log("[LocalStorageTest] Iframe loaded successfully");
            };
            iframe.onerror = (e) => {
              console.error("[LocalStorageTest] Iframe load error:", e);
              setError("Failed to load miniapp iframe");
            };
          } else {
            console.warn("[LocalStorageTest] Iframe not found after mount");
          }
        }, 500);
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

