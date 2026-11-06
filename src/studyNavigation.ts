import type { BookGroup, IeltsBook } from './data/ieltsTypes'

/** Every search lands on the word's own relationship neighborhood, never a topic chunk. */
export function locateWord(book:IeltsBook, word:string):[number,number]|undefined {
  const row=book.index.find(([w])=>w===word)
  return row ? [row[1],row[2]] : undefined
}
export function pageCenter(group:BookGroup, page:number):string|null {
  return group.pageCenters?.[page] ?? group.pages[page]?.[0] ?? null
}
