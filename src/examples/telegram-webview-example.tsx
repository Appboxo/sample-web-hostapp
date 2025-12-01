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
// Miniapp URL - fixed to kem-esim.ngrok.app (port 3000)
// Host app runs on sample-web-hostapp.ngrok.app (port 3001)
// Miniapp runs separately on kem-esim.ngrok.app (port 3000)
const MINIAPP_URL =
  process.env.REACT_APP_MINIAPP_URL || "https://kem-esim.ngrok.app";

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0NTczNTk0LCJpYXQiOjE3NjQ1NzI2OTQsImp0aSI6IjljNzk4NjU4YzE4MDQzYzdhNzVlMmE1ZWQyOWZmZTM5Iiwic3ViIjoiODczIiwiYXVkIjoiZXNpbS1taW5pYXBwIiwiaXNzIjoiZXNpbS1zZXJ2aWNlIn0.ojGaK_99hTmR7FHdtNBBZsZsUb2LQtX4duUQBJVpWlg";
const refreshToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NTE3NzQ5NCwiaWF0IjoxNzY0NTcyNjk0LCJqdGkiOiJkN2JlNmQ2YzEyMzI0MTM0YWRkMjgxMjUxNDYwNjI2NCIsInN1YiI6Ijg3MyIsImF1ZCI6ImVzaW0tbWluaWFwcCIsImlzcyI6ImVzaW0tc2VydmljZSJ9.zKMejlr3rYJ1qVIA0XWWtUHXXYxkn5842w_pBtqviq4";
  
function TelegramWebViewExample() {
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);
  const initRef = useRef(false); // Guard to prevent duplicate SDK initialization
  
  // Detect Telegram WebView environment
  const isTelegramWebView = detectTelegramWebView();
  const [showDebugPanel, setShowDebugPanel] = useState(true); // Show by default

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
      isDesktop: true,
      allowedOrigins: [
        window.location.origin,
        new URL(MINIAPP_URL).origin,
        "http://localhost:3000",
        "https://kem-esim.ngrok.app",
        "*",
      ],
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
          url: MINIAPP_URL,
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
  }, []); // Re-initialize if tokens change

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
          </div>
        )}
      </div>
    </div>
  );
}

export default TelegramWebViewExample;
