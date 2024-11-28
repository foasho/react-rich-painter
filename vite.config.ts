import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/index.tsx'),
      name: 'index',
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React'
        }
      }
    }
  },
  plugins: [react()],
});
