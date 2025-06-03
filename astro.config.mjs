
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';

export default defineConfig({
  server: {
    port: 3000,
  },  
  vite:{
        plugins: [tailwindcss()],
        server: {
      allowedHosts: [
        'submit-mae-ci-blackjack.trycloudflare.com',
        'localhost',
        '127.0.0.1'
      ]
    }
    },
    integrations: [react()],
});
