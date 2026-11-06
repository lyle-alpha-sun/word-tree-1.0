/** Keep the original grammatical explanation; add standard learner labels. */
export function formatPos(pos: string): string {
  if (pos === '词根') return pos
  const tags: string[] = []
  const base = pos.replace(/[（(][^）)]*[）)]/g, '')
  if (base.includes('名词')) tags.push('n.')
  if (base.includes('动词')) tags.push('v.')
  if (base.includes('形容词')) tags.push('adj.')
  if (base.includes('副词')) tags.push('adv.')
  const existing = pos.split(/\s+|\/+/)
  const missing = tags.filter(t=>!existing.includes(t))
  return missing.length ? `${pos} ${missing.join(' / ')}` : pos
}
