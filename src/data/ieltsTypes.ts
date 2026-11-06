/** 雅思词书数据结构（与 public/data/ielts-book.json 对齐） */
export interface BookWord {
  w: string
  zh?: string
  ipa?: string
  pos?: string
  ex?: Record<string, string>
  src?: 'ecdict' | 'missing'
  t?: 1
  formOf?: string
  formLabel?: string
  zhSource?: string
  freq?: { collins: number; oxford: number; bnc: number; frq?: number; tags?: string[] }
}

export interface BookGroup {
  id: string
  kind: 'catvar' | 'pending' | 'family' | 'word'
  title: string
  hub: string
  note: string
  members: string[]
  targets: string[]
  bridges: { derivedOrUnclear: string[]; inflected: string[] }
  pages: string[][]
  pageCenters?: string[]
  pageTitles?: string[]
  sourceLine: string
  license: string
  roots?: { id?: string; label: string; meaning?: string; origin?: string; memberWords?: string[]; source?: string; sourceUrl?: string }[]
  curatedEdges?: {from: string; to: string; kind: 'derivation' | 'etymology' | 'inflection' | 'association'; label?: string; status?: string; sourceUrl?: string}[]
  inflectionEdges: { from: string; to: string; kind: string; label?: string }[]
}

export interface IeltsBook {
  bookId: string
  bookTitle: string
  meta: {
    targetCount: number
    wordCount: number
    groupCount: number
    catvarGroups: number
    pendingGroups: number
    bridgeCount: number
    pageMax: number
    multiGroupWords: number
  }
  sources: { id: string; name: string; license: string; url: string; file: string; sha256: string }[]
  words: Record<string, BookWord>
  groups: BookGroup[]
  index: [string, number, number][]
}

export interface IeltsIndex {
  bookId: string
  meta: IeltsBook['meta']
  index: [string, number, number][]
}
