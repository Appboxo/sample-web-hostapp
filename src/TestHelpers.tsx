/**
 * Test Helpers for Desktop SDK
 * Uncomment these functions in App.tsx if you want to test events manually
 */

export const testLogin = () => {
  window.postMessage({
    handler: 'AppBoxoWebAppLogin',
    params: { confirmModalText: 'Please login to continue' },
    type: 'appboxo-js-sdk',
    request_id: Date.now()
  }, '*');
};

export const testPayment = () => {
  window.postMessage({
    handler: 'AppBoxoWebAppPay',
    params: {
      amount: 99.99,
      miniappOrderId: `order-${Date.now()}`,
      transactionToken: `token-${Date.now()}`,
      currency: 'USD'
    },
    type: 'appboxo-js-sdk',
    request_id: Date.now()
  }, '*');
};

export const testCustomEvent = () => {
  window.postMessage({
    handler: 'AppBoxoWebAppCustomEvent',
    params: {
      type: 'test-event',
      payload: {
        action: 'navigate',
        url: 'https://example.com',
        timestamp: Date.now()
      }
    },
    type: 'appboxo-js-sdk',
    request_id: Date.now()
  }, '*');
};

/**
 * Usage in browser console:
 * testLogin()
 * testPayment()
 * testCustomEvent()
 */

