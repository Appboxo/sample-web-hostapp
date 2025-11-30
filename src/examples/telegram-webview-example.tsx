import { useEffect, useState, useRef, useCallback } from "react";
import { AppboxoWebSDK } from "@appboxo/web-sdk";

// kem setttings
// And additional envs for boxo:
// VITE_BOXO_CLIENT_ID="host_a5801h7tkBLi"
// VITE_BOXO_SANDBOX_MODE="true"
// VITE_BOXO_DEBUG="false"
// VITE_BOXO_TRAVEL_ESIMS_APP_ID="app_IvcTDV"

// ============================================================================
// CONFIGURATION - Update with your miniapp URL
// ============================================================================
const CLIENT_ID = "host_a5801h7tkBLi"; // Replace with actual clientId
const APP_ID = "app_IvcTDV"; // Replace with actual appId
// Miniapp URL - fixed to kem-esim.ngrok.app (port 3000)
// Host app runs on sample-web-hostapp.ngrok.app (port 3001)
// Miniapp runs separately on kem-esim.ngrok.app (port 3000)
const MINIAPP_URL =
  process.env.REACT_APP_MINIAPP_URL || "https://kem-esim.ngrok.app";

/**
 * Detect if running in Telegram WebView environment
 * Uses the same logic as finom-desktop-host-sdk's initDataHandler
 */
function detectTelegramWebView(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check URL parameters
  const urlParams = window.location.hash.includes('tgWebApp') || 
                    window.location.search.includes('tgWebApp');
  
  // Check user agent
  const userAgent = navigator.userAgent.includes('Telegram') || 
                    navigator.userAgent.includes('WebView');
  
  // Check for Telegram SDK
  const hasTelegramSDK = !!(window as any).Telegram?.WebApp;
  
  return urlParams || userAgent || hasTelegramSDK;
}

function TelegramWebViewExample() {
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0NTIxNDgxLCJpYXQiOjE3NjQ1MjA1ODEsImp0aSI6IjgzMDc0OTdiY2E4MzRmMTRiM2M3NDRiNmM4ZWZhZGUyIiwic3ViIjoiODczIiwiYXVkIjoiZXNpbS1taW5pYXBwIiwiaXNzIjoiZXNpbS1zZXJ2aWNlIn0.1wHjHwe7VLR2LvvrkhoElpLJSvM8ofEN_50LXQGUgNA"
  );
  const [refreshToken, setRefreshToken] = useState<string>(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NTEyNTM4MSwiaWF0IjoxNzY0NTIwNTgxLCJqdGkiOiJiOTZlOWNkYzUyNzg0OTI4YjQyM2EzNTViMDg2MGU5MSIsInN1YiI6Ijg3MyIsImF1ZCI6ImVzaW0tbWluaWFwcCIsImlzcyI6ImVzaW0tc2VydmljZSJ9.McIyNfdDcMJaT_WdaYu6o-kilQrTIq9cL7Q54UGeRiE"
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);
  const initRef = useRef(false); // Guard to prevent duplicate SDK initialization
  
  // Detect Telegram WebView environment
  const isTelegramWebView = detectTelegramWebView();

  // Debug logs for visible display (Telegram WebView)
  const [debugLogs, setDebugLogs] = useState<
    Array<{
      time: string;
      message: string;
      type: "info" | "success" | "error";
      data?: any;
    }>
  >([]);
  const [showDebugPanel, setShowDebugPanel] = useState(true); // Show by default

  // Helper function to add debug logs
  const addDebugLog = useCallback((message: string, type: "info" | "success" | "error" = "info", data?: any) => {
    const time = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, { time, message, type, data }]);
    // Also log to console
    console.log(`[${type.toUpperCase()}] ${message}`, data || "");
  }, []);

  useEffect(() => {
    // Prevent SDK from being created multiple times (React Strict Mode guard)
    if (initRef.current) {
      return;
    }
    initRef.current = true;


    // Add listener before SDK initialization (capture phase)
    // window.addEventListener("message", messageListener, true);

    addDebugLog("Initializing AppboxoWebSDK...", "info");
    
    const boxoSdk = new AppboxoWebSDK({
      clientId: CLIENT_ID,
      appId: APP_ID,
      debug: true, // Enable debug to see SDK logs
      isDesktop: true,
      allowedOrigins: [
        window.location.origin,
        new URL(MINIAPP_URL).origin,
        "http://localhost:3000",
        "https://kem-esim.ngrok.app",
        "*",
      ],
      // Not using onGetAuthTokens - using onAuth lifecycle hook instead
    });

    addDebugLog("SDK created successfully", "success");

    addDebugLog("Message listener added (listening for all messages)", "success");

    sdkRef.current = boxoSdk;

    const mountMiniapp = async () => {
      if (!containerRef.current) {
        addDebugLog("Container not ready", "error");
        return;
      }
      try {
        setError(null);
        addDebugLog(`Mounting miniapp from ${MINIAPP_URL}...`, "info");
        const iframe = await boxoSdk.mount({
          container: containerRef.current,
          url: MINIAPP_URL,
          className: "miniapp-iframe",
        });
        setIsMounted(true);
        addDebugLog("✅ Miniapp mounted successfully", "success");

        // Register onAuth hook AFTER mount (SDK is now initialized)
        // Boxo Connect Direct - onAuth lifecycle hook
        // This is triggered when miniapp sends AppBoxoWebAppLogin request
        // Host app should request tokens in this hook and call setAuthTokens()
        // Priority: pre-set tokens (via setAuthTokens) > onGetAuthTokens > OAuth flow
        addDebugLog("Registering onAuth hook (after mount)...", "info");
        boxoSdk.onAuth(async () => {
          addDebugLog("✅ onAuth triggered - requesting tokens from backend...", "success");

          // Your backend calls Boxo Dashboard connect endpoint to request miniapp tokens
          // Replace this with your actual backend API call:
          // const response = await fetch('/api/get-miniapp-tokens', {
          //   headers: { 'Authorization': `Bearer ${yourToken}`, 'Content-Type': 'application/json' }
          // });
          // const tokens = await response.json();

          // Mock tokens for testing
          await new Promise((resolve) => setTimeout(resolve, 500));
          const mockToken = token.trim(); // Replace with actual token
          const mockRefreshToken = refreshToken.trim(); // Replace with actual refresh token

          addDebugLog("Setting tokens via setAuthTokens()", "info", {
            token: mockToken.substring(0, 20) + "...",
            refreshToken: mockRefreshToken.substring(0, 20) + "...",
          });
          boxoSdk.setAuthTokens(mockToken, mockRefreshToken);
          addDebugLog("✅ Tokens set successfully", "success");
        });
        addDebugLog("onAuth hook registered (after mount)", "success");

        boxoSdk.onLoginComplete((success: boolean, data?: any) => {
          addDebugLog(`Login complete: ${success ? "SUCCESS" : "FAILED"}`, success ? "success" : "error", data);
        });

        // Wait for iframe to load and check for messages
        if (iframe) {
          iframe.addEventListener("load", () => {
            addDebugLog("✅ Iframe loaded - miniapp should be ready", "success");
            
            // Wait a bit and check if miniapp sends any messages
            setTimeout(() => {
              addDebugLog("⏳ Checking if miniapp has sent messages (3 seconds after load)...", "info");
            }, 3000);
          }, { once: true });

          // Also check if iframe is already loaded
          if (iframe.contentDocument?.readyState === "complete") {
            addDebugLog("✅ Iframe already loaded", "success");
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        addDebugLog(`Mount error: ${errorMsg}`, "error", err);
        setError(errorMsg);
      }
    };

    // Wait a bit for container to be ready (keep setTimeout for safety)
    setTimeout(() => {
      mountMiniapp();
    }, 100);

    return () => {
      addDebugLog("Cleaning up SDK...", "info");
      boxoSdk.destroy();
    };
  }, [token, refreshToken, addDebugLog]); // Re-initialize if tokens change

  return (
    <div
      className="App"
      style={{
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1
          style={{ fontSize: "24px", fontWeight: "600", marginBottom: "8px" }}
        >
          Custom URL - Miniapp Container
        </h1>
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

        {/* Telegram WebView Detection Status */}
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #ddd",
            fontSize: "14px",
          }}
        >
          <strong>Telegram WebView:</strong> {isTelegramWebView ? "Detected" : "Not Detected"}
          {isTelegramWebView && (
            <span style={{ marginLeft: "10px", color: "#666" }}>
              (isTelegramWebView=true will be passed to miniapp)
            </span>
          )}
        </div>

        {/* Miniapp Container (SDK will create iframe here) */}
        <div className="iframe-container">
          <div ref={containerRef} className="miniapp-container" />
          <div className="iframe-note">
            <p>Status: {isMounted ? "Mounted" : "Mounting..."}</p>
            <p>SDK: {sdkRef.current ? "Ready" : "Initializing"}</p>
            <p>URL: {MINIAPP_URL}</p>
            <button
              onClick={() => {
                if (sdkRef.current) {
                  console.log("[OAuthExample] Calling logout()");
                  sdkRef.current.logout();
                  console.log("[OAuthExample] Logout completed");
                  alert(
                    "Logout called! Check console and localStorage/sessionStorage."
                  );
                }
              }}
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Debug Panel - Always visible for debugging */}
        {showDebugPanel && (
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#60a5fa",
                }}
              >
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
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {debugLogs.length === 0 ? (
                <div style={{ color: "#9ca3af", padding: "8px" }}>
                  No debug logs yet...
                </div>
              ) : (
                debugLogs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    padding: "8px",
                    backgroundColor:
                      log.type === "error"
                        ? "#7f1d1d"
                        : log.type === "success"
                        ? "#14532d"
                        : "#1f2937",
                    borderLeft: `3px solid ${
                      log.type === "error"
                        ? "#ef4444"
                        : log.type === "success"
                        ? "#22c55e"
                        : "#6b7280"
                    }`,
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: "#9ca3af", fontSize: "10px" }}>
                      {log.time}
                    </span>
                    <span
                      style={{
                        color:
                          log.type === "error"
                            ? "#ef4444"
                            : log.type === "success"
                            ? "#22c55e"
                            : "#9ca3af",
                        fontSize: "10px",
                        fontWeight: "600",
                      }}
                    >
                      {log.type.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ color: "#f3f4f6" }}>{log.message}                  </div>
                </div>
              )))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TelegramWebViewExample;
