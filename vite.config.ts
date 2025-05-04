import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(() => {
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'
  const isVercel = Boolean(process.env.VERCEL)

  // On Vercel serve from '/', on GH Pages serve from '/zip2rep/', otherwise local '/'
  const base = isVercel
    ? '/'
    : isGitHubPages
    ? '/zip2rep/'
    : '/'

  return {
    base,
    plugins: [
      react()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'client', 'src'),
        '@shared': path.resolve(__dirname, 'shared'),
        '@assets': path.resolve(__dirname, 'attached_assets'),
      },
    },
    root: path.resolve(__dirname, 'client'),
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
    },
  }
});
