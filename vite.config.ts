import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { version } from './package.json'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'InkStone',
        short_name: 'InkStone',
        description: '最好的Markdown编辑器，不止是编辑器！',
        theme_color: '#dde3e9',
        background_color: '#dde3e9',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        display_override: ['window-controls-overlay'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        file_handlers: [
          {
            action: '/',
            // name: 'Markdown',
            accept: {
              'text/markdown': [
                '.md',
                '.mkd',
                '.mdwn',
                '.mdown',
                '.markdown',
                '.markdn',
                '.mdtxt',
                '.mdtext',
                '.workbook',
              ],
            },
            // icons: [
            //   {
            //     src: '/markdown.png',
            //     sizes: '256x256',
            //     type: 'image/png',
            //   },
            // ],
          },
        ],
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html}',
          '**/*.{ico,png,svg,jpg,jpeg,webp}',
          '**/*.{woff,woff2,ttf,eot,otf}',
          '**/*.{json,xml,webmanifest}',
          '**/*.wasm', // 若有 WebAssembly 文件
        ],
        // 扩大扫描范围（关键配置！）
        globDirectory: 'dist',
        globFollow: true, // 遵循符号链接
        globStrict: true, // 严格模式
        globIgnores: [
          '**/node_modules/**',
          '**/sw.js', // 忽略 Service Worker 自身
        ],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 将限制增加到 20 MiB
        manifestTransforms: [
          async (originalManifest) => {
            const manifest = originalManifest.map((entry) => {
              if (entry.url.includes('assets/')) {
                entry.revision = entry.url.split('.').slice(-2, -1)[0]
              }
              return entry
            })
            return { manifest }
          },
        ],
        runtimeCaching: [
          {
            // 匹配该 CDN 的特定版本所有资源
            urlPattern: /^https:\/\/unpkg\.com\/vditor@3\.10\.9\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'vditor-cdn-v3.10.9',
              expiration: {
                maxEntries: 30, // 最多缓存 30 个文件
                maxAgeSeconds: 90 * 24 * 60 * 60, // 90 天
              },
              cacheableResponse: {
                statuses: [0, 200], // 包含 opaque 响应（跨域请求）
              },
            },
          },
        ],
        // globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2,ttf,eot,otf}'],
      },
    }),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  resolve: {
    extensions: ['.js', '.vue', '.json', '.ts'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
  css: {
    // CSS 预处理器
    preprocessorOptions: {
      // 定义全局 SCSS 变量
      scss: {
        additionalData: `
        @use "@/assets/variables.scss" as *;
      `,
      },
    },
  },
  build: {
    rollupOptions: {
      external: ['node-cache'],
      output: {
        // 主入口文件
        entryFileNames: 'assets/[name].[hash].js',
        // 动态导入的 chunk 文件
        chunkFileNames: 'assets/[name].[hash].js',
        // 静态资源（图片、字体等）
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks(id) {
          // if (id.includes('@imengyu/vue3-context-menu')) {
          //   return 'vue3-context-menu'
          // }
          if (id.includes('element-plus')) {
            return 'element-plus'
          }
          if (id.includes('src/views/MainAppView.vue')) {
            return 'mainAppView'
          }
          if (id.includes('src/utils/fontAwesomeLibrary.ts')) {
            return 'fontAwesomeLibrary'
          }
          if (id.includes('src/utils')) {
            return 'utils'
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
