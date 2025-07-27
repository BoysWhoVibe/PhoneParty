/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEBUG_MODE?: string
  readonly VITE_ENABLE_TEST_PLAYERS?: string
  readonly NODE_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}