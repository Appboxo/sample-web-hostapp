import { useEffect, useState, useRef } from "react";
import { AppboxoWebSDK } from "@appboxo/web-sdk";
import type { PaymentRequest, PaymentResponse } from "@appboxo/web-sdk";
import { PaymentStatusValues } from "../utils/constants";
import { createPaymentResponse } from "../utils/payment";

// ============================================================================
// CONFIGURATION
// ============================================================================
const CLIENT_ID = "602248"; // Replace with actual clientId
const APP_ID = "app_YQ7Phw"; // Replace with actual appId

// Enable payment handling (set to false if your app doesn't handle payments)
const ENABLE_PAYMENT = true;

function VercelExample() {
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [debugInfo, setDebugInfo] = useState<{
    miniappUrl?: string;
    iframeLoaded?: boolean;
    networkErrors?: string[];
  }>({});
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
      console.log("[OAuthExample] SDK already initialized, skipping");
      return;
    }
    initRef.current = true;

    const boxoSdk = new AppboxoWebSDK({
      clientId: CLIENT_ID,
      appId: APP_ID,
      debug: true, // Enable debug mode to see what's happening
      theme: theme,
      // locale: "ar",
      allowedOrigins: [], // Set `allowedOrigins` → restrict to specific domains
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

    // Boxo Connect OAuth - set auth code explicitly
    boxoSdk.setAuthCode("tNCYV57xV03Ds3ar63oQtddQxUxCRY"); // Replace with actual auth code

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
        setDebugInfo({});

        console.log("[OAuthExample] Starting mount...");

        // Option 1: Let SDK fetch URL from API (default behavior)
        await boxoSdk.mount({
          container: containerRef.current,
          className: "miniapp-iframe",
        });

        console.log("[OAuthExample] Mount completed, checking iframe...");

        // Function to check iframe
        const checkIframe = () => {
          const iframe:any = containerRef.current?.querySelector(
            "iframe"
          ) as HTMLIFrameElement | null;
          if (iframe && iframe.src && iframe.src !== window.location.href) {
            console.log("[OAuthExample] Iframe found:", {
              src: iframe.src,
              currentSrc: iframe.currentSrc || iframe.src,
              contentWindow: iframe.contentWindow ? "available" : "null",
            });
            setDebugInfo((prev) => ({
              ...prev,
              miniappUrl: iframe.src || iframe.currentSrc,
            }));

            // Monitor iframe load
            iframe.onload = () => {
              console.log("[OAuthExample] Iframe loaded successfully");
              setDebugInfo((prev) => ({
                ...prev,
                iframeLoaded: true,
              }));

              // Note: Cannot inject script into cross-origin iframe due to CORS
              // The miniapp needs to use TelegramStorage class or web-sdk needs to handle it
              // For now, Storage Bridge is ready to handle STORAGE_REQUEST messages
              console.log(
                "[OAuthExample] Storage Bridge is ready. Waiting for miniapp to send STORAGE_REQUEST..."
              );

              // Wait a bit and check if miniapp has sent any messages
              setTimeout(() => {
                console.log(
                  "[OAuthExample] Checking miniapp status after 3 seconds..."
                );
                console.log("[OAuthExample] If you see a white screen, check:");
                console.log(
                  "  1. Eruda Network tab - are there failed requests?"
                );
                console.log(
                  "  2. Eruda Console tab - are there errors from miniapp?"
                );
                console.log(
                  "  3. Is miniapp waiting for InitData? (web-sdk is ready)"
                );
              }, 3000);
            };

            iframe.onerror = (e:any) => {
              console.error("[OAuthExample] Iframe load error:", e);
              setError("Failed to load miniapp iframe");
              setDebugInfo((prev) => ({
                ...prev,
                iframeLoaded: false,
                networkErrors: [
                  ...(prev.networkErrors || []),
                  "Iframe load error",
                ],
              }));
            };

            // Check if iframe is already loaded
            if (iframe.contentDocument || iframe.contentWindow) {
              try {
                // Try to access iframe content (may fail due to CORS)
                const iframeDoc =
                  iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) {
                  console.log("[OAuthExample] Iframe document accessible");
                  setDebugInfo((prev) => ({
                    ...prev,
                    iframeLoaded: true,
                  }));
                }
              } catch (e) {
                // CORS error is expected, but iframe exists
                console.log(
                  "[OAuthExample] Iframe exists but CORS prevents access (normal)"
                );
              }
            }
            return true;
          }
          return false;
        };

        // Try immediately
        if (!checkIframe()) {
          // If not found, poll for iframe creation
          let attempts = 0;
          const pollInterval = setInterval(() => {
            attempts++;
            if (checkIframe() || attempts > 20) {
              clearInterval(pollInterval);
              if (attempts > 20) {
                console.warn(
                  "[OAuthExample] Iframe not found after 10 seconds"
                );
                setDebugInfo((prev) => ({
                  ...prev,
                  networkErrors: [
                    ...(prev.networkErrors || []),
                    "Iframe not created after mount",
                  ],
                }));
              }
            }
          }, 500);
        }

        setIsMounted(true);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("[OAuthExample] Mount error:", err);
        setError(errorMessage);
        setDebugInfo((prev) => ({
          ...prev,
          networkErrors: [...(prev.networkErrors || []), errorMessage],
        }));
        // Also trigger global error handler
        window.dispatchEvent(
          new ErrorEvent("error", {
            message: errorMessage,
            error: err instanceof Error ? err : new Error(String(err)),
          })
        );
      }
    };

    mountMiniapp();

    return () => {
      boxoSdk.destroy();
    };
  }, [theme]);

  return (
    <div className="App">
      <div className="">
        <main className="">
          <div className="card">
            <h2>OAuth - Miniapp Container</h2>
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
            <div className="">
              <div ref={containerRef} className="" style={{width: "100%", height: "100vh"}} />
              <div className="iframe-note">
                <p>Status: {isMounted ? "Mounted" : "Mounting..."}</p>
                <p>SDK: {sdkRef.current ? "Ready" : "Initializing"}</p>
                {debugInfo.miniappUrl ? (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      wordBreak: "break-all",
                    }}
                  >
                    Miniapp URL: {debugInfo.miniappUrl}
                  </p>
                ) : (
                  <p style={{ fontSize: "11px", color: "#ff9800" }}>
                    ⚠️ Miniapp URL: Not detected yet (checking...)
                  </p>
                )}
                {debugInfo.iframeLoaded !== undefined && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: debugInfo.iframeLoaded ? "#4caf50" : "#f44336",
                    }}
                  >
                    Iframe: {debugInfo.iframeLoaded ? "Loaded" : "Not loaded"}
                  </p>
                )}
                {debugInfo.networkErrors &&
                  debugInfo.networkErrors.length > 0 && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "8px",
                        backgroundColor: "#fee",
                        borderRadius: "4px",
                      }}
                    >
                      <strong style={{ fontSize: "11px" }}>Errors:</strong>
                      {debugInfo.networkErrors.map((err, i) => (
                        <div
                          key={i}
                          style={{ fontSize: "10px", color: "#c00" }}
                        >
                          {err}
                        </div>
                      ))}
                    </div>
                  )}
                <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      if (sdkRef.current) {
                        console.log("[VercelExample] Calling logout()");
                        sdkRef.current.logout();
                        console.log("[VercelExample] Logout completed");
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

export default VercelExample;
