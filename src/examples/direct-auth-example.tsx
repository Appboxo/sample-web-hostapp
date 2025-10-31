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

function DirectAuthExample() {
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
            <h2>Direct Auth - Miniapp Container</h2>
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

export default DirectAuthExample;