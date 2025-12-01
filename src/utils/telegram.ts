/**
 * Detect if running in Telegram WebView environment
 * Uses the same logic as finom-desktop-host-sdk's initDataHandler
 */
function detectTelegramWebView(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // Check URL parameters
  const urlParams =
    window.location.hash.includes("tgWebApp") ||
    window.location.search.includes("tgWebApp");

  // Check user agent
  const userAgent =
    navigator.userAgent.includes("Telegram") ||
    navigator.userAgent.includes("WebView");

  // Check for Telegram SDK
  const hasTelegramSDK = !!(window as any).Telegram?.WebApp;

  return urlParams || userAgent || hasTelegramSDK;
}

export { detectTelegramWebView };