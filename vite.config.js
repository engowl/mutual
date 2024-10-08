import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  // Check if the POLYFILLS environment variable is set to true
  const usePolyfills = process.env.VITE_POLYFILLS === 'true';
  console.log('polyfills:', process.env.VITE_POLYFILLS);
  console.log('usePolyfills:', usePolyfills);

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
