import { useEffect, useState, useRef } from "react";
import { AppboxoWebSDK } from "@appboxo/web-sdk";
import { detectTelegramWebView } from "../utils/telegram";
import type { PaymentRequest, PaymentResponse } from "@appboxo/web-sdk";
import { PaymentStatusValues } from "../utils/constants";
import { createPaymentResponse } from "../utils/payment";

// kem setttings
// And additional envs for boxo:
// VITE_BOXO_CLIENT_ID="host_a5801h7tkBLi"
// VITE_BOXO_SANDBOX_MODE="true"
// VITE_BOXO_DEBUG="false"
// VITE_BOXO_TRAVEL_ESIMS_APP_ID="app_IvcTDV"

// Enable payment handling (set to false if your app doesn't handle payments)
const ENABLE_PAYMENT = true;

// ============================================================================
// CONFIGURATION - Update with your miniapp URL
// ============================================================================
const CLIENT_ID = "host_a5801h7tkBLi"; // Replace with actual clientId
const APP_ID = "app_IvcTDV"; // Replace with actual appId

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0NzM5MjQzLCJpYXQiOjE3NjQ3MzgzNDMsImp0aSI6ImYzM2Y0NGQwMWE3NjRmNzk4ZTk4N2NkNDdiMTc3MTVkIiwic3ViIjoiODczIiwiYXVkIjoiZXNpbS1taW5pYXBwIiwiaXNzIjoiZXNpbS1zZXJ2aWNlIn0.iTfVsnruDkUoj6v_LQc6JyjinjPY7JGy0IsE_jhnGx4";
const refreshToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NTM0MzE0MywiaWF0IjoxNzY0NzM4MzQzLCJqdGkiOiI5NDg2YzMzNGYxMTA0YzEyODcyMzdiYTM1YjQyZTc1NyIsInN1YiI6Ijg3MyIsImF1ZCI6ImVzaW0tbWluaWFwcCIsImlzcyI6ImVzaW0tc2VydmljZSJ9.LEqH_sDFb_UezBL2JOb2Frdk5q2DremS6firvmcoED0";
  
function TelegramWebViewExample() {
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);
  const initRef = useRef(false); // Guard to prevent duplicate SDK initialization
  
  // Detect Telegram WebView environment
  const isTelegramWebView = detectTelegramWebView();
  const [showDebugPanel, setShowDebugPanel] = useState(true); // Show by default

  useEffect(() => {
    const htmlElement = document.documentElement;
    const actualTheme = theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    htmlElement.setAttribute('data-theme', actualTheme);
  }, []);

  useEffect(() => {
    if (sdkRef.current && theme) {
      sdkRef.current.setTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    // Prevent SDK from being created multiple times (React Strict Mode guard)
    if (initRef.current) {
      return;
    }
    initRef.current = true;

    // Add listener before SDK initialization (capture phase)
    // window.addEventListener("message", messageListener, true);
    const boxoSdk = new AppboxoWebSDK({
      clientId: CLIENT_ID,
      appId: APP_ID,
      debug: true, // Enable debug to see SDK logs
      theme: theme,
      // Payment handler (optional - remove if ENABLE_PAYMENT is false)
      ...(ENABLE_PAYMENT && {
        onPaymentRequest: async (
          paymentData: PaymentRequest
        ): Promise<PaymentResponse> => {
          console.log("[Payment] Payment request:", paymentData);

          // TODO: Replace with your payment API call
          // const response = await fetch('/api/payments/process', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${yourToken}` },
          //   body: JSON.stringify(paymentData)
          // });
          // const result = await response.json();

          await new Promise((resolve) => setTimeout(resolve, 1000));
          return createPaymentResponse(
            paymentData,
            PaymentStatusValues.Success,
            `order_${Date.now()}`
          );
        },
      }),
    });

    if (ENABLE_PAYMENT) {
      boxoSdk.onPaymentComplete((success: boolean, data?: any) => {
        console.log("[Payment] Payment complete:", success, data);
      });
    }


    sdkRef.current = boxoSdk;

    const mountMiniapp = async () => {
      if (!containerRef.current) {
        return;
      }
      try {
        setError(null);
        const iframe = await boxoSdk.mount({
          container: containerRef.current,
          className: "miniapp-iframe",
        });
        setIsMounted(true);

        // Register onAuth hook AFTER mount (SDK is now initialized)
        // Boxo Connect Direct - onAuth lifecycle hook
        // This is triggered when miniapp sends AppBoxoWebAppLogin request
        // Host app should request tokens in this hook and call setAuthTokens()
        // Priority: pre-set tokens (via setAuthTokens) > onGetAuthTokens > OAuth flow
        boxoSdk.onAuth(async () => {

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
          boxoSdk.setAuthTokens(mockToken, mockRefreshToken);
        });

        boxoSdk.onLoginComplete((success: boolean, data?: any) => {
          // log login complete
        });

        // Wait for iframe to load and check for messages
        if (iframe) {
          iframe.addEventListener("load", () => {
          }, { once: true });

          // Also check if iframe is already loaded
          if (iframe.contentDocument?.readyState === "complete") {
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
      }
    };

    // Wait a bit for container to be ready (keep setTimeout for safety)
    setTimeout(() => {
      mountMiniapp();
    }, 100);

    return () => {
      boxoSdk.destroy();
    };
  }, [theme]); // Re-initialize if theme changes

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
          Telegram WebView - Miniapp Container
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
          <strong>Telegram WebView:</strong>
          {isTelegramWebView ? "Detected" : "Not Detected"}
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
            <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  if (sdkRef.current) {
                    console.log("[TelegramWebViewExample] Calling logout()");
                    sdkRef.current.logout();
                    console.log("[TelegramWebViewExample] Logout completed");
                    alert(
                      "Logout called! Check console and localStorage/sessionStorage."
                    );
                  }
                }}
                style={{
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
              <div style={{ 
                display: "flex", 
                gap: "8px", 
                alignItems: "center",
                padding: "6px 12px",
                backgroundColor: "var(--bg-secondary, #f8f9fa)",
                border: "1px solid var(--border-color, #e9ecef)",
                borderRadius: "4px",
              }}>
                <label style={{ 
                  fontSize: "12px", 
                  fontWeight: "500",
                  color: "var(--text-primary, #212529)",
                  marginRight: "4px" 
                }}>
                  Theme:
                </label>
                <select
                  value={theme}
                  onChange={(e) => {
                    const newTheme = e.target.value as 'dark' | 'light' | 'system';
                    setTheme(newTheme);
                    const htmlElement = document.documentElement;
                    const actualTheme = newTheme === 'system' 
                      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                      : newTheme;
                    htmlElement.setAttribute('data-theme', actualTheme);
                    if (sdkRef.current) {
                      sdkRef.current.setTheme(newTheme);
                    }
                  }}
                  style={{
                    padding: "4px 8px",
                    border: "1px solid var(--border-color, #ccc)",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    backgroundColor: "var(--bg-secondary, white)",
                    color: "var(--text-primary, #212529)",
                    outline: "none",
                  }}
                >
                  <option value="system">System</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default TelegramWebViewExample;
