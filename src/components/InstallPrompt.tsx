import { Download, Share, SquarePlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isIosSafari, isStandalone } from '../lib/pwa'
import { Button } from './ui/Button'
import { Card } from './ui/primitives'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'install-prompt-dismissed'

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * "Add to home screen" helper. Android/desktop Chrome: a real install button (beforeinstallprompt).
 * iPhone Safari: Apple offers no install API, so we show the two Share-menu steps instead.
 * Hidden when already installed or dismissed.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(() => isStandalone() || wasDismissed())
  const ios = isIosSafari()

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setHidden(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (hidden || (!deferred && !ios)) return null

  function dismiss() {
    setHidden(true)
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <Card className="relative flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="pr-8">
        <h2 className="flex items-center gap-2 text-base">
          <Download aria-hidden="true" className="size-4 text-indigo" /> Play from your home screen
        </h2>
        {ios && !deferred ? (
          <p className="mt-1 text-sm text-muted">
            In Safari, tap <Share aria-label="Share" className="inline size-4 align-text-bottom" /> <strong>Share</strong>, then{' '}
            <SquarePlus aria-hidden="true" className="inline size-4 align-text-bottom" /> <strong>Add to Home Screen</strong>.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">Install the app for full-screen play that also works offline.</p>
        )}
      </div>
      {deferred ? (
        <Button
          size="sm"
          onClick={() => {
            void deferred.prompt()
            void deferred.userChoice.then(() => setDeferred(null))
          }}
        >
          Install app
        </Button>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install suggestion"
        className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-lilac-50"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </Card>
  )
}
