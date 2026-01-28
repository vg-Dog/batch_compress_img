import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {
    entry: 'main.js'
  },
  preload: {
    entry: 'preload.js'
  },
  renderer: {
    entry: 'frontend/src/index.jsx'
  }
});