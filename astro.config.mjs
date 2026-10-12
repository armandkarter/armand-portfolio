// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Active le rendu serveur pour gérer les formulaires / API / Actions
  adapter: node({
    mode: 'standalone', // Génère un serveur Node.js autonome
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});