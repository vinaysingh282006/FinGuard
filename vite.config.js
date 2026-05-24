import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/whale': {
        target: 'https://api.whale-alert.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/whale/, ''),
      },
      '/api/opensanctions': {
        target: 'https://api.opensanctions.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/opensanctions/, ''),
      },
      '/api/etherscan': {
        target: 'https://api.etherscan.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/etherscan/, ''),
      },
      '/api/blockchain': {
        target: 'https://blockchain.info',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/blockchain/, ''),
      },
      '/api/blockchair': {
        target: 'https://api.blockchair.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/blockchair/, ''),
      },
    },
  },
})
