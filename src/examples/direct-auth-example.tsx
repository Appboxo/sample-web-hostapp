import { useEffect, useState, useRef } from "react";
import { AppboxoWebSDK } from "@appboxo/web-sdk";
import type { PaymentRequest, PaymentResponse } from "@appboxo/web-sdk";
import { PaymentStatusValues } from "../utils/constants";
import { createPaymentResponse } from "../utils/payment";

// ============================================================================
// CONFIGURATION
// ============================================================================
const CLIENT_ID = "your-client-id-here"; // Replace with actual clientId
const APP_ID = "your-app-id-here"; // Replace with actual appId

// Enable payment handling (set to false if your app doesn't handle payments)
const ENABLE_PAYMENT = true;

function DirectAuthExample() {
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);
  const initRef = useRef(false); // Guard to prevent duplicate SDK initialization

  useEffect(() => {
    // Prevent SDK from being created multiple times (React Strict Mode guard)
    if (initRef.current) {
      console.log('[DirectAuthExample] SDK already initialized, skipping');
      return;
    }
    initRef.current = true;

    const boxoSdk = new AppboxoWebSDK({
      clientId: CLIENT_ID,
      appId: APP_ID,
      debug: false,
      // locale: "ar",
      isDesktop: true,
      allowedOrigins: [], // Set `allowedOrigins` → restrict to specific domains
      // Payment handler (optional - remove if ENABLE_PAYMENT is false)
      ...(ENABLE_PAYMENT && {
        onPaymentRequest: async (
          paymentData: PaymentRequest
        ): Promise<PaymentResponse> => {
          console.log("[Payment] Payment request:", paymentData);

          // TODO: Replace with actual payment API call
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

      // Alternative: Use onGetAuthTokens callback instead of onAuth hook
      // onGetAuthTokens: async () => {
      //   const response = await fetch('/api/get-miniapp-tokens');
      //   const result = await response.json();
      //   return { token: result.access_token, refresh_token: result.refresh_token };
      // }
    });

    // Boxo Connect Direct - onAuth lifecycle hook
    // Your backend should call Boxo Dashboard connect endpoint to get miniapp tokens
    boxoSdk.onAuth(async () => {
      console.log(
        "[Auth] onAuth triggered - requesting tokens from backend..."
      );

      // Your backend calls Boxo Dashboard connect endpoint to request miniapp tokens
      // Replace this with your actual backend API call:
      // const response = await fetch('/api/get-miniapp-tokens', {
      //   headers: { 'Authorization': `Bearer ${yourToken}`, 'Content-Type': 'application/json' }
      // });
      // const tokens = await response.json();

      // Mock tokens for testing
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockToken = "mock_miniapp_token_" + Date.now(); // Replace with actual token
      const mockRefreshToken = "mock_refresh_token_" + Date.now(); // Replace with actual refresh token

      console.log("[Auth] Setting tokens:", {
        token: mockToken,
        refreshToken: mockRefreshToken,
      });
      boxoSdk.setAuthTokens(mockToken, mockRefreshToken);
    });

    // Alternative: Pre-set tokens before login (if you already have them)
    // const tokens = await getTokensFromBackend();
    // boxoSdk.setAuthTokens(tokens.access_token, tokens.refresh_token);

    boxoSdk.onLoginComplete((success: boolean, data?: any) => {
      console.log("[Auth] Login complete:", success, data);
    });

    if (ENABLE_PAYMENT) {
      boxoSdk.onPaymentComplete((success: boolean, data?: any) => {
        console.log("[Payment] Payment complete:", success, data);
      });
    }

    sdkRef.current = boxoSdk;

    const mountMiniapp = async () => {
      if (!containerRef.current) return;
      try {
        setError(null);
        await boxoSdk.mount({
          container: containerRef.current,
          className: "miniapp-iframe",
        });
        setIsMounted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    mountMiniapp();

    return () => {
      boxoSdk.destroy();
    };
  }, []);

  return (
    <div className="App">
      <div className="main-container">
        <main className="main-content">
          <div className="card">
            <h2>Direct Auth - Miniapp Container</h2>
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
            <div className="iframe-container">
              <div ref={containerRef} className="miniapp-container" />
              <div className="iframe-note">
                <p>Status: {isMounted ? "Mounted" : "Mounting..."}</p>
                <p>SDK: {sdkRef.current ? "Ready" : "Initializing"}</p>
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
          </div>
        </main>
      </div>
    </div>
  );
}

export default DirectAuthExample;