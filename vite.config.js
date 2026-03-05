import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]

export default defineConfig({
  base: repoName ? `/${repoName}/` : '/',
  plugins: [
    tailwindcss(),
  ],
})
