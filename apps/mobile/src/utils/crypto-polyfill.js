// Crypto Polyfill for React Native Web
// Fixes: crypto.getRandomValues() not supported error
// This provides a basic implementation for UUID generation on web

if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
  // Create a simple polyfill for crypto.getRandomValues
  if (typeof global !== 'undefined') {
    global.crypto = {
      getRandomValues: (array) => {
        // Use Math.random() as fallback
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
    };
  }

  // Also set on window for web
  if (typeof window !== 'undefined' && typeof window.crypto === 'undefined') {
    window.crypto = {
      getRandomValues: (array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
    };
  }
}

export default {};

