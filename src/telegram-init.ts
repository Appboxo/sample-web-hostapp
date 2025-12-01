/**
 * Telegram WebView Initialization
 * Handles Telegram-specific setup and polyfills
 * 
 * This file must be imported early (in index.tsx) to ensure
 * TelegramGameProxy is available before Telegram WebView tries to use it.
 */

// TelegramGameProxy Polyfill - MUST be initialized immediately
// Telegram WebView expects this object for game communication
// If not available, Telegram will throw errors repeatedly
if (typeof (window as any).TelegramGameProxy === 'undefined') {
  (window as any).TelegramGameProxy = {
    receiveEvent: function (event: string, data: any) {
      // Silently ignore - we don't need game proxy functionality
      // Only log in development to avoid console spam
      if (process.env.NODE_ENV === 'development') {
        console.debug('[TelegramGameProxy] receiveEvent (polyfill):', event, data);
      }
    },
    postEvent: function (event: string, data: any) {
      // Silently ignore - we don't need game proxy functionality
      if (process.env.NODE_ENV === 'development') {
        console.debug('[TelegramGameProxy] postEvent (polyfill):', event, data);
      }
    },
  };
  if (process.env.NODE_ENV === 'development') {
    console.log('[TelegramInit] TelegramGameProxy polyfill initialized');
  }
}

// Initialize eruda for mobile debugging in Telegram WebView
// Note: Eruda may show cross-origin errors when accessing iframes, but it still works for console logs
if (process.env.NODE_ENV === 'development') {
  const initErudaInTelegram = () => {
    // Check multiple indicators for Telegram environment
    const urlParams = window.location.hash.includes('tgWebApp') || window.location.search.includes('tgWebApp');
    const userAgent = navigator.userAgent.includes('Telegram') || navigator.userAgent.includes('WebView');
    const hasTelegramSDK = !!(window as any).Telegram?.WebApp;
    const isTelegram = urlParams || userAgent || hasTelegramSDK;
    
    if (isTelegram && !(window as any).__eruda) {
      console.log('[TelegramInit] Attempting to load eruda in Telegram WebView...');
      
      import('eruda')
        .then((lib) => {
          try {
            // Suppress cross-origin errors by wrapping eruda initialization
            const originalError = console.error;
            console.error = (...args: any[]) => {
              // Filter out cross-origin frame errors from eruda
              const errorMsg = args[0]?.toString() || '';
              if (errorMsg.includes('Blocked a frame with origin') || 
                  errorMsg.includes('cross-origin frame')) {
                // Silently ignore eruda's cross-origin errors
                return;
              }
              originalError.apply(console, args);
            };
            
            lib.default.init({
              // Configure eruda to avoid iframe access issues
              autoScale: true,
              defaults: {
                displaySize: 50,
                transparency: 0.9,
                theme: 'auto'
              }
            });
            
            // Restore original console.error after a delay
            setTimeout(() => {
              console.error = originalError;
            }, 1000);
            
            (window as any).__eruda = lib.default;
            console.log('[TelegramInit] ✅ Eruda initialized successfully');
          } catch (err) {
            console.error('[TelegramInit] ❌ Eruda initialization error:', err);
          }
        })
        .catch((err) => {
          console.error('[TelegramInit] ❌ Eruda failed to load:', err);
        });
    } else if ((window as any).__eruda) {
      console.log('[TelegramInit] Eruda already initialized');
    }
  };
  
  // Try immediately if Telegram is already loaded
  if (typeof window !== 'undefined') {
    initErudaInTelegram();
    
    // Also try after page load
    window.addEventListener('load', () => {
      setTimeout(initErudaInTelegram, 500);
    });
    
    // Also try after delays (Telegram SDK might load later)
    [1000, 2000, 3000, 5000].forEach((delay) => {
      setTimeout(initErudaInTelegram, delay);
    });
  }
}

// Export for potential future use
export {};

