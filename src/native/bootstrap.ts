import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

/**
 * Native-only start-up, loaded with a dynamic import from main.tsx in the native build only.
 * - Android hardware back button: go back inside the app, leave the app from the home screen.
 * - Status bar matches the light app bar.
 * - Splash screen hides once React has painted the first screen.
 * Every call is best-effort: a plugin failure must never stop the game from opening.
 */
/** The slice of the data router this module needs (keeps it decoupled from router internals). */
export interface NativeRouter {
  readonly state: { readonly location: { readonly pathname: string } }
  navigate(delta: number): Promise<void> | void
}

export async function startNative(router: NativeRouter): Promise<void> {
  await App.addListener('backButton', ({ canGoBack }) => {
    const atHome = router.state.location.pathname === '/'
    if (canGoBack && !atHome) void router.navigate(-1)
    else void App.exitApp()
  }).catch(() => undefined)

  await StatusBar.setStyle({ style: Style.Light }).catch(() => undefined)

  requestAnimationFrame(() => {
    void SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => undefined)
  })
}
