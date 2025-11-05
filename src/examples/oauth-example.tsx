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

function OAuthExample() {
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);
  const initRef = useRef(false); // Guard to prevent duplicate SDK initialization

  useEffect(() => {
    console.log('[OAuthExample] useEffect running');
    
    // Prevent SDK from being created multiple times (React Strict Mode guard)
    if (initRef.current) {
      console.log('[OAuthExample] SDK already initialized, skipping');
      return;
    }
    initRef.current = true;

    const boxoSdk = new AppboxoWebSDK({
      clientId: CLIENT_ID,
      appId: APP_ID,
      debug: true,

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
    boxoSdk.setAuthCode("your-auth-code-here"); // Replace with actual auth code

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
      console.log('[OAuthExample] useEffect cleanup running');
      // Use closure variable boxoSdk directly, not sdkRef.current
      // because sdkRef might be overwritten by a new instance
      if (boxoSdk) {
        console.log('[OAuthExample] Cleanup: destroying SDK');
        boxoSdk.destroy();
        if (sdkRef.current === boxoSdk) {
          sdkRef.current = null;
        }
        setIsMounted(false);
      } else {
        console.log('[OAuthExample] Cleanup: boxoSdk is null, skipping destroy');
      }
    };
  }, []);

  return (
    <div className="App">
      <div className="main-container">
        <main className="main-content">
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
            <div className="iframe-container">
              <div ref={containerRef} className="miniapp-container" />
              <div className="iframe-note">
                <p>Status: {isMounted ? "Mounted" : "Mounting..."}</p>
                <p>SDK: {sdkRef.current ? "Ready" : "Initializing"}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default OAuthExample;