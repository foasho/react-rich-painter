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
    // ブラシ画像をBase64としてインライン化（10KB以下）
    assetsInlineLimit: 10240,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'react/jsx-runtime'
        },
        // アセットファイル名を維持
        assetFileNames: 'assets/[name].[ext]',
      }
    }
  },
  plugins: [react()],
});
