import { useEffect } from 'react'

export interface PageMeta {
  title: string
  description: string
  /** Set true for private views (dashboard, admin) that must not be indexed. */
  noIndex?: boolean
}

function upsertMeta(name: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Sets document title, description and robots directive for the current route. */
export function usePageMeta({ title, description, noIndex = false }: PageMeta): void {
  useEffect(() => {
    document.title = title
    upsertMeta('description', description)
    upsertMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow')
  }, [title, description, noIndex])
}
