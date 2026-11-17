import { ArrowLeft, Building2, CircleAlert, Eye, EyeOff, Landmark, Lock, Smartphone, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/ui/Button'
import { Notice } from '../../components/ui/Notice'
import { Badge, Card } from '../../components/ui/primitives'
import {
  maskAccount,
  normalizeIfsc,
  validateBank,
  validateUpi,
  type BankDetails,
  type BankErrors,
} from '../../lib/bankValidation'
import { cn } from '../../lib/cn'

/*
 * CONNECT-WALLET DESIGN PROTOTYPE
 * - Never contacts a bank, UPI app or payments provider; the final step always says linking is off.
 * - Details live only in this component's state: never persisted, logged or sent, and cleared on close.
 * - Only loaded when BANK_LINK_PROTOTYPE is on (development builds by default); production builds drop it.
 */

type Method = 'bank' | 'upi'
type Step = 'method' | 'details' | 'review' | 'result'

const EMPTY_BANK: BankDetails = { holder: '', account: '', confirmAccount: '', ifsc: '' }

const inputClass =
  'mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-base text-heading outline-none transition placeholder:text-muted/60 focus:ring-2'

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error: string | undefined
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-heading">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function fieldProps(id: string, error: string | undefined, hasHint: boolean) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
    className: cn(inputClass, error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-line focus:border-indigo focus:ring-indigo/20'),
  }
}

function ConnectDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId()
  const base = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<Step>('method')
  const [method, setMethod] = useState<Method>('bank')
  const [bank, setBank] = useState<BankDetails>(EMPTY_BANK)
  const [upi, setUpi] = useState('')
  const [showAccount, setShowAccount] = useState(false)
  const [touched, setTouched] = useState(false)
  const [confirmOwner, setConfirmOwner] = useState(false)

  const bankErrors: BankErrors = touched ? validateBank(bank) : {}
  const upiError = touched ? validateUpi(upi) : null

  // Focus the dialog on open and on each step change; restore focus to the opener on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    // Lock background scroll while the dialog is open.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      opener?.focus?.()
    }
  }, [])
  useEffect(() => {
    const first = dialogRef.current?.querySelector<HTMLElement>('[data-autofocus], input, button')
    first?.focus()
  }, [step])

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !dialogRef.current) return
    // Keep keyboard focus inside the dialog.
    const focusables = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]')]
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (!first || !last) return
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  function continueFromDetails() {
    setTouched(true)
    const valid = method === 'bank' ? Object.keys(validateBank(bank)).length === 0 : validateUpi(upi) === null
    if (valid) {
      setStep('review')
      return
    }
    // Move focus to the first field with an error once React has rendered the messages.
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
  }

  const stepIndex = { method: 1, details: 2, review: 3, result: 4 }[step]

  // Portal to <body>: ancestors with backdrop-filter/transform would otherwise trap `position: fixed`.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-heading/40 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-white bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-float motion-safe:animate-fade-up sm:max-w-lg sm:rounded-panel sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {step === 'details' || step === 'review' ? (
              <button
                type="button"
                onClick={() => setStep(step === 'review' ? 'details' : 'method')}
                aria-label="Back"
                className="inline-flex size-9 items-center justify-center rounded-xl text-muted hover:bg-lilac-50"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
              </button>
            ) : null}
            <div>
              <h2 id={titleId} className="text-xl">
                Connect a bank account
              </h2>
              <p className="text-xs text-muted">
                Step {stepIndex} of 4 · <Badge tone="amber">Prototype</Badge>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-9 items-center justify-center rounded-xl text-muted hover:bg-lilac-50"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <div className="mt-2 h-1 overflow-hidden rounded-full bg-lilac-50" aria-hidden="true">
          <div className="h-full rounded-full bg-brand-gradient transition-[width] duration-300" style={{ width: `${stepIndex * 25}%` }} />
        </div>

        {step === 'method' ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-muted">How would you like to connect?</p>
            <fieldset className="space-y-2">
              <legend className="sr-only">Connection method</legend>
              {(
                [
                  { key: 'bank', title: 'Bank account', body: 'Account number and IFSC code', icon: Landmark },
                  { key: 'upi', title: 'UPI ID', body: 'For example name@okhdfcbank', icon: Smartphone },
                ] as const
              ).map((m) => (
                <label
                  key={m.key}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition',
                    method === m.key ? 'border-indigo/40 bg-lilac-50/70 shadow-[inset_0_0_0_1px_rgb(109_90_230/0.25)]' : 'border-line-soft hover:border-indigo/25',
                  )}
                >
                  <input
                    type="radio"
                    name={`${base}-method`}
                    value={m.key}
                    checked={method === m.key}
                    onChange={() => setMethod(m.key)}
                    className="size-4 accent-[#6d5ae6]"
                  />
                  <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-xl bg-white text-indigo shadow-card">
                    <m.icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-medium text-heading">{m.title}</span>
                    <span className="block text-sm text-muted">{m.body}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <Button className="w-full" onClick={() => setStep('details')}>
              Continue
            </Button>
          </div>
        ) : null}

        {step === 'details' ? (
          <form
            className="mt-5 space-y-4"
            noValidate
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault()
              continueFromDetails()
            }}
          >
            {method === 'bank' ? (
              <>
                <Field id={`${base}-holder`} label="Account holder name" error={bankErrors.holder}>
                  <input
                    {...fieldProps(`${base}-holder`, bankErrors.holder, false)}
                    value={bank.holder}
                    onChange={(e) => setBank({ ...bank, holder: e.target.value })}
                    autoCapitalize="words"
                    data-autofocus
                  />
                </Field>
                <Field id={`${base}-account`} label="Account number" error={bankErrors.account}>
                  <div className="relative">
                    <input
                      {...fieldProps(`${base}-account`, bankErrors.account, false)}
                      type={showAccount ? 'text' : 'password'}
                      inputMode="numeric"
                      value={bank.account}
                      onChange={(e) => setBank({ ...bank, account: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccount((v) => !v)}
                      aria-label={showAccount ? 'Hide account number' : 'Show account number'}
                      className="absolute top-1/2 right-2 mt-0.75 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-lilac-50"
                    >
                      {showAccount ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
                    </button>
                  </div>
                </Field>
                <Field id={`${base}-confirm`} label="Re-enter account number" error={bankErrors.confirmAccount}>
                  <input
                    {...fieldProps(`${base}-confirm`, bankErrors.confirmAccount, false)}
                    type="password"
                    inputMode="numeric"
                    value={bank.confirmAccount}
                    onChange={(e) => setBank({ ...bank, confirmAccount: e.target.value })}
                    onPaste={(e) => e.preventDefault()}
                  />
                </Field>
                <Field id={`${base}-ifsc`} label="IFSC code" error={bankErrors.ifsc} hint="11 characters, printed on your cheque book or passbook.">
                  <input
                    {...fieldProps(`${base}-ifsc`, bankErrors.ifsc, true)}
                    value={bank.ifsc}
                    onChange={(e) => setBank({ ...bank, ifsc: normalizeIfsc(e.target.value).slice(0, 11) })}
                    autoCapitalize="characters"
                    placeholder="HDFC0001234"
                  />
                </Field>
              </>
            ) : (
              <Field id={`${base}-upi`} label="UPI ID" error={upiError ?? undefined} hint="Find it in your UPI app under your profile.">
                <input
                  {...fieldProps(`${base}-upi`, upiError ?? undefined, true)}
                  value={upi}
                  onChange={(e) => setUpi(e.target.value.trim())}
                  inputMode="email"
                  autoCapitalize="none"
                  placeholder="name@bank"
                  data-autofocus
                />
              </Field>
            )}
            <p className="flex items-start gap-2 text-xs text-muted">
              <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" /> Prototype: details stay on this screen only. Nothing is
              saved or sent.
            </p>
            <Button type="submit" className="w-full">
              Review details
            </Button>
          </form>
        ) : null}

        {step === 'review' ? (
          <div className="mt-5 space-y-4">
            <dl className="divide-y divide-line-soft rounded-2xl border border-line-soft">
              {(method === 'bank'
                ? [
                    ['Account holder', bank.holder.trim()],
                    ['Account number', maskAccount(bank.account)],
                    ['IFSC', normalizeIfsc(bank.ifsc)],
                    ['Bank code', normalizeIfsc(bank.ifsc).slice(0, 4)],
                  ]
                : [['UPI ID', upi]]
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium text-heading tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <label className="flex items-start gap-2 text-sm text-heading">
              <input
                type="checkbox"
                checked={confirmOwner}
                onChange={(e) => setConfirmOwner(e.target.checked)}
                className="mt-0.5 size-4 accent-[#6d5ae6]"
              />
              This account is in my own name.
            </label>
            <Button className="w-full" disabled={!confirmOwner} onClick={() => setStep('result')}>
              <Building2 aria-hidden="true" className="size-4" /> Connect account
            </Button>
          </div>
        ) : null}

        {step === 'result' ? (
          <div className="mt-5 space-y-4" role="status">
            <div className="flex flex-col items-center text-center">
              <span aria-hidden="true" className="inline-flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <CircleAlert className="size-7" />
              </span>
              <h3 className="mt-3 text-lg">Bank linking is switched off</h3>
              <p className="mt-1 text-sm text-muted">
                Your account was not connected. This screen is a design prototype: nothing was sent to a bank and your details were not
                saved.
              </p>
            </div>
            <Notice tone="info">
              Linking a bank to paid entries and prizes would make this a real-money game, which needs a licensed payments partner and
              legal approval first. The game keeps using free play coins.
            </Notice>
            <Button className="w-full" onClick={onClose} data-autofocus>
              Done
            </Button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

/** Wallet-tab card that opens the connect flow. Loaded only when BANK_LINK_PROTOTYPE is on (see WalletTab). */
export function ConnectWalletCard() {
  const [open, setOpen] = useState(false)
  return (
    <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <Landmark className="size-5" />
        </span>
        <div>
          <h3 className="flex flex-wrap items-center gap-2 text-lg">
            Connect wallet <Badge tone="amber">Prototype</Badge>
          </h3>
          <p className="text-sm text-muted">Link a bank account or UPI ID. Design preview only — no bank connection is made.</p>
        </div>
      </div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Connect
      </Button>
      {open ? <ConnectDialog onClose={() => setOpen(false)} /> : null}
    </Card>
  )
}
