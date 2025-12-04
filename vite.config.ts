import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // <--- Imported path

export default defineConfig(({ mode }) => {
  // We can now remove (process as any) because we installed @types/node
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    
    // START: Added this block to tell Vite how to handle "@"
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // END
    
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});