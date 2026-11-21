/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "true" to show the connect-wallet design prototype outside development builds. */
  readonly VITE_BANK_LINK_PROTOTYPE?: string
  /** "memory" for the framed preview build (see src/app/router.tsx). */
  readonly VITE_ROUTER?: 'memory'
  /** "native" for the bundle shipped inside the Android/iOS app (npm run build:native). */
  readonly VITE_PLATFORM?: 'native'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
