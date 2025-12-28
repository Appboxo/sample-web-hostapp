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
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);
  const initRef = useRef(false); // Guard to prevent duplicate SDK initialization

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
      console.log('[DirectAuthExample] SDK already initialized, skipping');
      return;
    }
    initRef.current = true;

    const boxoSdk = new AppboxoWebSDK({
      clientId: CLIENT_ID,
      appId: APP_ID,
      debug: false,
      theme: theme,
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
  }, [theme]);

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
                <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      if (sdkRef.current) {
                        console.log("[DirectAuthExample] Calling logout()");
                        sdkRef.current.logout();
                        console.log("[DirectAuthExample] Logout completed");
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
          </div>
        </main>
      </div>
    </div>
  );
}

export default DirectAuthExample;