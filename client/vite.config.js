import { defineConfig } from 'vite'
import fs from 'fs'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('./.cert/privateKey.key'),
      cert: fs.readFileSync('./.cert/certificate.crt'),
      ca: fs.readFileSync('./.cert/ca_bundle.crt'), // Include the CA bundle if required
    },
    port: 443, // Use port 443 for HTTPS
  },
  preview: {
    port: 443,
  }
})

