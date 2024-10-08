import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Check if the POLYFILLS environment variable is set to true
  const usePolyfills = process.env.POLYFILLS === 'true';

  return {
    plugins: [
      react(),
      // Conditionally add the nodePolyfills plugin if POLYFILLS is true
      usePolyfills && nodePolyfills(),
    ].filter(Boolean), // Ensure we don't include `false` values in the plugins array
    // Conditionally add Rollup options if POLYFILLS is true
    build: usePolyfills
      ? {
          rollupOptions: {
            treeshake: false,
          },
        }
      : {},
  };
});
