import React, { useEffect, useState, useRef } from "react";
import { AppboxoWebSDK } from "@appboxo/web-sdk";
import "./App.css";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);

  // Create SDK instance once
  useEffect(() => {
    const boxoSdk = new AppboxoWebSDK({
      clientId: "602248",
      appId: "app29296",
      debug: true,
    });
    boxoSdk.setAuthCode("tNCYV57xV03Ds3ar63oQtddQxUxCRY");
    sdkRef.current = boxoSdk;

    return () => {
      boxoSdk.destroy();
    };
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
