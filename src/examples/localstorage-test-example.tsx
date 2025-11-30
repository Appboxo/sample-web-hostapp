import { useEffect, useState, useRef } from "react";
import { AppboxoWebSDK } from "@appboxo/web-sdk";

// ============================================================================
// CONFIGURATION - Update with your miniapp URL
// ============================================================================
const CLIENT_ID = "602248"; // Replace with actual clientId
const APP_ID = "app_ovTT2l"; // Replace with actual appId
// Miniapp URL - fixed to summer.ngrok.dev (port 3000)
// Host app runs on sample-web-hostapp.ngrok.app (port 3001)
// Miniapp runs separately on summer.ngrok.dev (port 3000)
const MINIAPP_URL =
  process.env.REACT_APP_MINIAPP_URL || "https://summer.ngrok.dev";

function LocalStorageTestExample() {
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);
  const initRef = useRef(false); // Guard to prevent duplicate SDK initialization

  useEffect(() => {
    // Prevent SDK from being created multiple times (React Strict Mode guard)
    if (initRef.current) {
      return;
    }
    initRef.current = true;

    const boxoSdk = new AppboxoWebSDK({
      clientId: CLIENT_ID,
      appId: APP_ID,
      debug: false,
      isDesktop: true,
      allowedOrigins: [
        window.location.origin,
        new URL(MINIAPP_URL).origin,
        "http://localhost:3000",
        "https://summer.ngrok.dev",
        "*",
      ],
    });

    // Boxo Connect Direct - onAuth lifecycle hook
    // Your backend should call Boxo Dashboard connect endpoint to get miniapp tokens
    boxoSdk.onAuth(async () => {
      console.log(
        "[Auth] onAuth triggered - requesting tokens from backend..."
      );

      // TODO: Replace this with your actual backend API call:
      // Your backend calls Boxo Dashboard connect endpoint to request miniapp tokens
      // const response = await fetch('/api/get-miniapp-tokens', {
      //   headers: { 'Authorization': `Bearer ${yourToken}`, 'Content-Type': 'application/json' }
      // });
      // const tokens = await response.json();
      // boxoSdk.setAuthTokens(tokens.access_token, tokens.refresh_token);

      // Mock tokens for demo/testing - Replace with actual backend call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0NTgxNTMzLCJpYXQiOjE3NjQ0OTUxMzMsImp0aSI6IjhlOTYyMWM2YjRjNjRhM2Q4ZDVhNDhhZTBjMmQyM2U0Iiwic3ViIjoiOTYxIiwiYXVkIjoiZXNpbS1taW5pYXBwIiwiaXNzIjoiZXNpbS1zZXJ2aWNlIn0.PjA1_ihdqtTHn7bXGf8ZWAZDxknHlUJ8rMA_8L1JORM";
      const mockRefreshToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NTA5OTkzMywiaWF0IjoxNzY0NDk1MTMzLCJqdGkiOiI4YzdiZjdkODlkZDQ0NzdjYmRkZTEwY2FlYzMwOTdmMCIsInN1YiI6Ijk2MSIsImF1ZCI6ImVzaW0tbWluaWFwcCIsImlzcyI6ImVzaW0tc2VydmljZSJ9.VbnEQIokMxVSAnrd2rPRhuPD0w4ZTOZsXW2MsBerrGs";

      console.log("[Auth] Setting tokens from backend");
      boxoSdk.setAuthTokens(mockToken, mockRefreshToken);
    });

    boxoSdk.onLoginComplete((success: boolean, data?: any) => {
      console.log("[Auth] Login complete:", success, data);
    });

    sdkRef.current = boxoSdk;

    const mountMiniapp = async () => {
      if (!containerRef.current) {
        console.error("[LocalStorageTest] Container not ready");
        return;
      }
      try {
        setError(null);
        await boxoSdk.mount({
          container: containerRef.current,
          url: MINIAPP_URL,
          className: "miniapp-iframe",
        });
        setIsMounted(true);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("[LocalStorageTest] Mount error:", errorMsg);
        setError(errorMsg);
      }
    };

    // Wait a bit for container to be ready (keep setTimeout for safety)
    setTimeout(() => {
      mountMiniapp();
    }, 100);

    return () => {
      boxoSdk.destroy();
    };
  }, []);

  return (
    <div
      className="App"
      style={{
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1
          style={{ fontSize: "24px", fontWeight: "600", marginBottom: "8px" }}
        >
          Custom URL - Miniapp Container
        </h1>
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

        {/* Miniapp Container (SDK will create iframe here) */}
        <div className="iframe-container">
          <div ref={containerRef} className="miniapp-container" />
          <div className="iframe-note">
            <p>Status: {isMounted ? "Mounted" : "Mounting..."}</p>
            <p>SDK: {sdkRef.current ? "Ready" : "Initializing"}</p>
            <p>URL: {MINIAPP_URL}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocalStorageTestExample;
