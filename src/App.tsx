import { useEffect, useState, useRef } from "react";
import { AppboxoWebSDK } from "@appboxo/web-sdk";
import "./App.css";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);

  // Create SDK instance once
  useEffect(() => {
    const appboxoWebSDK = new AppboxoWebSDK({
      clientId: "your-client-id-here", // Replace with actual clientId 
      appId: "your-app-id-here", // Replace with actual appId
      debug: true,
    });
    appboxoWebSDK.setAuthCode("your-auth-code-here"); // Replace with actual auth code
    sdkRef.current = appboxoWebSDK;

    return () => {
      appboxoWebSDK.destroy();
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
