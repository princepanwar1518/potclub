import { useEffect } from 'react'

export interface PageMeta {
  title: string
  description: string
  /** Set true for private views (dashboard, admin) that must not be indexed. */
  noIndex?: boolean
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Sets document title, description and robots directive for the current route. */
export function usePageMeta({ title, description, noIndex = false }: PageMeta): void {
  useEffect(() => {
    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
  }, [title, description, noIndex])
}
