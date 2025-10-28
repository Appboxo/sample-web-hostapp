import React, { useEffect, useState, useRef } from "react";
import { AppboxoWebSDK } from "web-sdk";
// Test helpers available at /src/TestHelpers.tsx
import "./App.css";

const config = {
  clientId: "602248",
  appId: "app29296",
  baseUrl: "https://dashboard.appboxo.com/api/v1",
  debug: true,
};

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize SDK
  useEffect(() => {
    const boxoSdk = new AppboxoWebSDK(config);
    boxoSdk.setAuthCode("tNCYV57xV03Ds3ar63oQtddQxUxCRY");

    // Set iframe and initialize
    if (iframeRef.current) {
      boxoSdk.setIframe(iframeRef.current);
      boxoSdk.initialize();
      setIsInitialized(true);
    }

    return () => {
      boxoSdk.destroy();
    };
  }, []);

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
