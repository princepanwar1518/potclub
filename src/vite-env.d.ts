/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "true" to show the connect-wallet design prototype outside development builds. */
  readonly VITE_BANK_LINK_PROTOTYPE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
