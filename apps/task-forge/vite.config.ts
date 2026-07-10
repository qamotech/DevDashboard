import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Task Forge builds into apps/DevDashboard/task-forge so the static hub can
// link to it. base: './' keeps asset paths relative when the built index.html
// is served from inside the DevDashboard tree.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../DevDashboard/task-forge',
    emptyOutDir: true,
  },
});
