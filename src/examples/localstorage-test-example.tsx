import { useEffect, useState, useRef } from "react";
import { AppboxoWebSDK } from "@appboxo/web-sdk";

// ============================================================================
// CONFIGURATION - Update with your miniapp URL
// ============================================================================
const CLIENT_ID = "602248"; // Replace with actual clientId
const APP_ID = "app_ovTT2l"; // Replace with actual appId
// Miniapp URL - update this to match your miniapp ngrok domain
// Miniapp is running on port 3000 with ngrok domain: summer.ngrok.dev
// For testing with real miniapp, use root path: https://summer.ngrok.dev
const MINIAPP_URL =
  process.env.REACT_APP_MINIAPP_URL || "https://summer.ngrok.dev";

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  timestamp: string;
}

function LocalStorageTestExample() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [token, setToken] = useState<string>(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0MTUxNjYxLCJpYXQiOjE3NjQxNTA3NjEsImp0aSI6IjNlYTlmNWJiMDVhYzRlMTZiZjk2MTFiYzA0ZmU1MTQ5Iiwic3ViIjoiNTkyIiwiYXVkIjoiZXNpbS1taW5pYXBwIiwiaXNzIjoiZXNpbS1zZXJ2aWNlIn0.P7NZ8RLPy-ImkEDYhQzz8I8em7XY4oZ7-XWSgMCx05w"
  );
  const [refreshToken, setRefreshToken] = useState<string>(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NDc1NTU2MSwiaWF0IjoxNzY0MTUwNzYxLCJqdGkiOiIzMTIyZDM1YmQwNGM0NjhmYTY1MzE1MjgzNjVlNDViNiIsInN1YiI6IjU5MiIsImF1ZCI6ImVzaW0tbWluaWFwcCIsImlzcyI6ImVzaW0tc2VydmljZSJ9.85Mgs0LNgEAgwI-AWNIJ7-1y_aezxiMU5kepRe5YFnA"
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<AppboxoWebSDK | null>(null);

  // Initialize SDK with onGetAuthTokens callback
  useEffect(() => {
    if (sdkRef.current) {
      console.log("[HostApp] SDK already initialized");
      return;
    }

    console.log("[HostApp] Initializing AppboxoWebSDK...");
    
    // Add message listener to track all messages from miniapp
    const messageListener = (event: MessageEvent) => {
      const eventData = event.data;
      const origin = event.origin;
      
      // Log ALL messages from miniapp origin for debugging
      if (origin.includes('summer.ngrok.dev') || origin.includes('localhost:3000')) {
        console.log(`[HostApp] Message from miniapp (${origin}):`, {
          type: eventData?.type,
          handler: eventData?.handler,
          message: eventData?.message,
          data: eventData?.data,
          fullData: eventData,
        });
      }
      
      // Check if this is an Appboxo SDK message
      const isAppboxoSdkMessage = eventData && typeof eventData === 'object' && 
        (eventData.type === 'appboxo-js-sdk' || eventData.handler);
      
      if (isAppboxoSdkMessage) {
        const handler = eventData.handler || 'unknown';
        console.log(`[HostApp] Received Appboxo SDK message: ${handler}`, {
          handler,
          request_id: eventData.request_id,
          origin,
          params: eventData.params,
        });
        
        if (handler === 'AppBoxoWebAppGetInitData') {
          console.log("[HostApp] Received AppBoxoWebAppGetInitData request from miniapp");
          console.log("[HostApp] Request ID:", eventData.request_id);
          console.log("[HostApp] SDK should automatically handle this, but if not, we'll send a response");
          
          // If SDK doesn't respond, manually send a response after a short delay
          setTimeout(() => {
            const iframe = containerRef.current?.querySelector("iframe");
            if (iframe?.contentWindow) {
              const response = {
                type: 'appboxo-host-response',
                handler: 'AppBoxoWebAppGetInitData',
                data: {
                  app_id: APP_ID,
                  client_id: CLIENT_ID,
                  payload: '',
                  data: {
                    handlers: ['AppBoxoWebAppLogin', 'AppBoxoWebAppGetInitData'],
                    capabilities: ['AppBoxoWebAppLogin', 'AppBoxoWebAppGetInitData'],
                  },
                  sandbox_mode: false,
                },
                request_id: eventData.request_id,
              };
              console.log("[HostApp] Manually sending InitData response:", response);
              iframe.contentWindow.postMessage(response, '*');
            }
          }, 100);
        } else if (handler === 'AppBoxoWebAppLogin') {
          console.log("[HostApp] Received AppBoxoWebAppLogin request from miniapp - SDK should call onGetAuthTokens");
        }
      } else if (eventData?.type === 'miniapp-debug') {
        // Debug messages - just log, don't process
        console.log(`[HostApp] Debug message from miniapp: ${eventData.message}`);
        
        // If miniapp is about to call sendPromise but we haven't received the SDK message,
        // proactively send InitData response to prevent timeout
        if (eventData.data?.step === 'before_sendPromise' && eventData.data?.handler === 'AppBoxoWebAppGetInitData') {
          console.log("[HostApp] Miniapp is about to call sendPromise but we haven't received SDK message yet");
          console.log("[HostApp] Proactively sending InitData response to prevent timeout...");
          
          // Generate a request_id for the response
          const requestId = `proactive-${Date.now()}`;
          
          setTimeout(() => {
            const iframe = containerRef.current?.querySelector("iframe");
            if (iframe?.contentWindow) {
              const response = {
                type: 'appboxo-host-response',
                handler: 'AppBoxoWebAppGetInitData',
                data: {
                  app_id: APP_ID,
                  client_id: CLIENT_ID,
                  payload: '',
                  data: {
                    handlers: ['AppBoxoWebAppLogin', 'AppBoxoWebAppGetInitData'],
                    capabilities: ['AppBoxoWebAppLogin', 'AppBoxoWebAppGetInitData'],
                  },
                  sandbox_mode: false,
                },
                request_id: requestId,
              };
              console.log("[HostApp] Proactively sending InitData response:", response);
              iframe.contentWindow.postMessage(response, '*');
            }
          }, 50);
        };
      }
    };
    
    // Add listener before SDK initialization
    window.addEventListener('message', messageListener, true);
    console.log("[HostApp] Message listener added to track Appboxo SDK messages");
    
    const boxoSdk = new AppboxoWebSDK({
      clientId: CLIENT_ID,
      appId: APP_ID,
      debug: true,
      isDesktop: true,
      allowedOrigins: [
        window.location.origin,
        "http://localhost:3000",
        "https://summer.ngrok.dev",
        "https://esim-telegram-web.ngrok.app",
        "*", // Allow all for testing
      ],
      // Configure auth token callback - returns tokens from user input
      onGetAuthTokens: async () => {
        console.log("[HostApp] onGetAuthTokens called - returning tokens from input fields");
        
        // Return tokens from state (user input)
        if (token.trim() && refreshToken.trim()) {
          console.log("[HostApp] Returning tokens from input fields");
          return {
            token: token.trim(),
            refresh_token: refreshToken.trim(),
          };
        } else {
          console.warn("[HostApp] onGetAuthTokens called but tokens are not set yet");
          // Return empty tokens - miniapp will handle this
          return {
            token: "",
            refresh_token: "",
          };
        }
      },
    });

    sdkRef.current = boxoSdk;
    console.log("[HostApp] SDK initialized successfully");

    // Mount miniapp when container is ready
    const mountMiniapp = async () => {
      if (!containerRef.current) {
        console.error("[HostApp] Container ref is null");
        return;
      }

      try {
        console.log("[HostApp] Mounting miniapp with SDK...");
        console.log("[HostApp] SDK object:", boxoSdk);
        console.log("[HostApp] SDK methods:", Object.keys(boxoSdk));
        
        await boxoSdk.mount({
          container: containerRef.current,
          url: MINIAPP_URL,
          className: "miniapp-iframe",
        });
        console.log("[HostApp] Miniapp mounted successfully");
        
        // Check if iframe was created
        const iframe = containerRef.current?.querySelector("iframe");
        if (iframe) {
          console.log("[HostApp] Iframe found:", {
            src: iframe.src,
            contentWindow: iframe.contentWindow ? "available" : "null",
          });
          
          // Ensure iframe has full size
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.style.border = "none";
          console.log("[HostApp] Iframe styles applied");
          
          // Listen for iframe load
          iframe.onload = () => {
            console.log("[HostApp] Iframe loaded, SDK should be ready to handle messages");
          };
        } else {
          console.warn("[HostApp] Iframe not found after mount!");
        }
        
        setIsMounted(true);
      } catch (error) {
        console.error("[HostApp] Failed to mount miniapp:", error);
      }
    };

    // Wait a bit for container to be ready
    setTimeout(() => {
      mountMiniapp();
    }, 100);

    return () => {
      // Cleanup message listener
      window.removeEventListener('message', messageListener, true);
    };
  }, [token, refreshToken]); // Re-initialize if tokens change

  useEffect(() => {
    // Listen for test results from miniapp
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from miniapp origin or any origin for testing
      const allowedOrigins = [
        window.location.origin,
        "http://localhost:3000",
        "https://summer.ngrok.dev",
        "https://esim-finom-desktop.ngrok.app",
        "https://esim-telegram-web.ngrok.app",
        "https://summer.ngrok.dev",
        "*", // Allow all for testing
      ];

      const isAllowed =
        allowedOrigins.includes("*") ||
        allowedOrigins.some((origin) => event.origin.includes(origin.replace("*", "")));

      if (!isAllowed) {
        console.log("[HostApp] Message from unknown origin:", event.origin);
        return;
      }

      // Check if this is a test result message
      if (event.data && typeof event.data === "object" && event.data.type === "localstorage-test-result") {
        const result: TestResult = {
          test: event.data.test || "unknown",
          success: event.data.success || false,
          message: event.data.message || "",
          timestamp: new Date().toLocaleTimeString(),
        };

        console.log("[HostApp] Test result received:", result);
        setTestResults((prev) => [result, ...prev]);
      } else if (event.data && typeof event.data === "object" && event.data.type === "localstorage-test-ready") {
        console.log("[HostApp] Miniapp is ready for testing");
        setIsMounted(true);
      }
    };

    window.addEventListener("message", handleMessage);
    console.log("[HostApp] Message listener added");

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);


  const sendToken = () => {
    if (!token.trim()) {
      alert("Please enter a token first");
      return;
    }

    if (!refreshToken.trim()) {
      alert("Please enter a refreshToken");
      return;
    }

    const tokenValue = token.trim();
    const refreshTokenValue = refreshToken.trim();

    console.log("[HostApp] Tokens set in state - SDK will return them when miniapp calls onGetAuthTokens");
    
    // Add a test result to show tokens are ready
    setTestResults((prev) => [
      {
        test: "Set Tokens",
        success: true,
        message: `Token (${tokenValue.length} chars) and RefreshToken (${refreshTokenValue.length} chars) are ready. Miniapp will receive them when calling universalBridge.login()`,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);

    // If SDK is initialized and miniapp is mounted, we can trigger a refresh
    // or the miniapp will automatically call login when useBoxoLogin hook runs
    if (sdkRef.current && isMounted) {
      console.log("[HostApp] Tokens are ready. Miniapp should call universalBridge.login() to get them via SDK");
    }
  };

  return (
    <div className="App" style={{ padding: "20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "8px" }}>Miniapp Integration Demo</h1>
        <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
          Host application with embedded miniapp in iframe
        </p>

        {/* Status */}
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: isMounted ? "#f0f9ff" : "#fff7ed",
            border: `1px solid ${isMounted ? "#0ea5e9" : "#fb923c"}`,
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          <strong>Status:</strong> {isMounted ? "Miniapp Ready" : "Waiting for miniapp..."}
          <br />
          <strong>Miniapp URL:</strong> {MINIAPP_URL}
        </div>

        {/* Token Input */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "16px", fontWeight: "600" }}>Authentication Tokens</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "bold", color: "#333" }}>
                Access Token:
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your access token here..."
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "14px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "bold", color: "#333" }}>
                Refresh Token:
              </label>
              <input
                type="text"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                placeholder="Enter your refresh token here..."
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "14px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                }}
              />
            </div>
            <button
              onClick={sendToken}
              disabled={!isMounted || !token.trim() || !refreshToken.trim()}
              style={{
                padding: "10px 16px",
                backgroundColor: isMounted && token.trim() && refreshToken.trim() ? "#2563eb" : "#9ca3af",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isMounted && token.trim() && refreshToken.trim() ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "500",
                width: "100%",
              }}
            >
              Set Tokens
            </button>
          </div>
          <p style={{ marginTop: "12px", marginBottom: 0, fontSize: "13px", color: "#6b7280" }}>
            Enter both access token and refresh token. The miniapp will request them via SDK when needed.
          </p>
        </div>

        {/* Control Buttons - Commented out for demo */}
        {/* 
        <div style={{ marginBottom: "20px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => sendTestCommand("test-write")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Test Write
          </button>
          <button
            onClick={() => sendTestCommand("test-read")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Test Read
          </button>
          <button
            onClick={() => sendTestCommand("test-remove")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Test Remove
          </button>
          <button
            onClick={() => sendTestCommand("test-clear")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Test Clear
          </button>
          <button
            onClick={() => sendTestCommand("test-all")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Run All Tests
          </button>
        </div>
        */}

        {/* Test Results - Commented out for demo */}
        {/* 
        <div
          style={{
            marginBottom: "20px",
            padding: "16px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>Test Results ({testResults.length})</h3>
          {testResults.length === 0 ? (
            <p style={{ color: "#6b7280", fontStyle: "italic", fontSize: "14px" }}>No test results yet. Click buttons above to run tests.</p>
          ) : (
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: "12px",
                    marginBottom: "8px",
                    backgroundColor: result.success ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${result.success ? "#bbf7d0" : "#fecaca"}`,
                    borderRadius: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>
                      {result.success ? "✓" : "✗"} {result.test}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{result.timestamp}</div>
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "13px", color: "#374151" }}>{result.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        */}

        {/* Miniapp Container (SDK will create iframe here) */}
        <div
          ref={containerRef}
          className="miniapp-container"
          style={{
            width: "100%",
            minHeight: "800px",
            height: "80vh",
            maxHeight: "1200px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "#fff",
            position: "relative",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        />

        {/* Instructions */}
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "13px",
          }}
        >
          <h4 style={{ marginTop: 0, fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Instructions</h4>
          <ol style={{ marginBottom: 0, paddingLeft: "20px", color: "#6b7280", lineHeight: "1.6" }}>
            <li>Ensure miniapp is running at: <code style={{ backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>{MINIAPP_URL}</code></li>
            <li>Enter Access Token and Refresh Token in the input fields above</li>
            <li>Click "Set Tokens" to configure authentication</li>
            <li>Miniapp will automatically request tokens via SDK when needed</li>
            <li>Check miniapp console for API calls and authentication status</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default LocalStorageTestExample;

