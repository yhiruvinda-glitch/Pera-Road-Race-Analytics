import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// Fix for ESM compatibility: define __dirname using import.meta.url
// This resolves the error: "Cannot find name '__dirname'"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use __dirname instead of process.cwd() to resolve "Property 'cwd' does not exist on type 'Process'"
  // For a vite.config.ts at project root, these directories are equivalent
  const env = loadEnv(mode, __dirname, '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    define: {
      // Correctly expose process.env.API_KEY to the client-side code
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  }
})
