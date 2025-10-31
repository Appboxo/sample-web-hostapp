import { useEffect, useState, useRef } from "react";
import { AppboxoWebSDK } from "@appboxo/web-sdk";
import type { PaymentRequest, PaymentResponse } from "@appboxo/web-sdk";
import { PaymentStatusValues } from "../utils/constants";
import { createPaymentResponse } from "../utils/payment";

// ============================================================================
// CONFIGURATION
// ============================================================================
const MINIAPP_IFRAME_URL = "http://localhost:3000";
const CLIENT_ID = "your-client-id-here"; // Replace with actual clientId
const APP_ID = "your-app-id-here"; // Replace with actual appId

// Enable payment handling (set to false if your app doesn't handle payments)
const ENABLE_PAYMENT = true;

function OAuthExample() {
  const [isInitialized, setIsInitialized] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);

  useEffect(() => {
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
    return () => boxoSdk.destroy();
  }, []);

  const handleIframeLoad = () => {
    if (sdkRef.current && iframeRef.current && !isInitialized) {
      sdkRef.current.setIframe(iframeRef.current);
      sdkRef.current.initialize();
      setIsInitialized(true);
    }
  };

  return (
    <div className="App">
      <div className="main-container">
        <main className="main-content">
          <div className="card">
            <h2>OAuth - Miniapp Container</h2>
            <div className="iframe-container">
              <iframe
                ref={iframeRef}
                id="miniapp-iframe"
                src={MINIAPP_IFRAME_URL}
                title="Miniapp"
                className="miniapp-iframe"
                onLoad={handleIframeLoad}
              />
              <div className="iframe-note">
                <p>Iframe: {iframeRef.current ? "Ready" : "Loading..."}</p>
                <p>SDK: {isInitialized ? "Initialized" : "Not initialized"}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default OAuthExample;