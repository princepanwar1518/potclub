export function tabPanelProps(idBase: string, key: string) {
  return {
    role: 'tabpanel' as const,
    id: `${idBase}-panel-${key}`,
    'aria-labelledby': `${idBase}-tab-${key}`,
    tabIndex: 0,
  }
}
