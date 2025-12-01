const path = require('path');
const react = require('@vitejs/plugin-react');

/** @type {import('vite').UserConfig} */
module.exports = {
  cacheDir: './.vite-cache',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
};
