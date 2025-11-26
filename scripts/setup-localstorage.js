// Setup localStorage polyfill for Node.js 25+ before webpack runs
// This must run BEFORE HtmlWebpackPlugin tries to access localStorage
if (typeof global !== 'undefined') {
  const storage = {};
  const localStorageMock = {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => {
      storage[key] = String(value);
    },
    removeItem: (key) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach(key => delete storage[key]);
    },
    get length() {
      return Object.keys(storage).length;
    },
    key: (index) => {
      const keys = Object.keys(storage);
      return keys[index] || null;
    }
  };

  // Set on global scope for Node.js (must be set before webstorage module initializes)
  global.localStorage = localStorageMock;
  if (typeof globalThis !== 'undefined') {
    globalThis.localStorage = localStorageMock;
  }
}


