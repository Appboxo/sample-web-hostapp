import { useEffect, useState, useRef } from "react";
import { AppboxoWebSDK } from "@appboxo/web-sdk";
import type { PaymentRequest, PaymentResponse } from "@appboxo/web-sdk";
import "./App.css";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);

  useEffect(() => {
    const boxoSdk = new AppboxoWebSDK({
      clientId: "your-client-id-here", // Replace with actual clientId
      appId: "your-app-id-here", // Replace with actual appId
      debug: true,
      // Payment handler - replace this with your Finom payment API call
      onPaymentRequest: async (
        paymentData: PaymentRequest
      ): Promise<PaymentResponse> => {
        console.log("Payment request:", paymentData);

        // TODO: Replace with actual Finom payment API call
        // const response = await fetch('/api/finom/payments/process', { ... });
        // const result = await response.json();

        // Mock response for demo
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return {
          ...paymentData,
          status: "paid", // 'paid' | 'failed' | 'in_process' | 'cancelled'
          hostappOrderId: `order_${Date.now()}`,
        };
      },
    });

    boxoSdk.setAuthCode("your-auth-code-here"); // Replace with actual auth code
    boxoSdk.onPaymentComplete((success, data) => {
      console.log("Payment complete:", success, data);
    });

    sdkRef.current = boxoSdk;
    return () => boxoSdk.destroy();
  }, []);

  // Handle iframe load
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
          {/* Iframe */}
          <div className="card">
            <h2>Miniapp Container</h2>
            <div className="iframe-container">
              <iframe
                ref={iframeRef}
                id="miniapp-iframe"
                src="http://localhost:3000"
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

export default App;
