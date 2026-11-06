/** 关系三分：派生 / 词形变化 / 词源 */
export type EdgeKind = 'derivation' | 'inflection' | 'etymology' | 'association'

export interface Collocation {
  phrase: string
  zh: string
}

export interface Example {
  en: string
  zh: string
}

export interface WordEntry {
  id: string
  word: string
  pos: string
  ipa?: string
  family: string
  gloss: string
  note?: string
  collocations: Collocation[]
  examples: Example[]
}

export interface RootEntry {
  id: string
  label: string
  origin: string
  gloss: string
}

export interface Edge {
  from: string
  to: string
  kind: EdgeKind
  label?: string
  /** 标签的短版之外的完整解释（悬浮提示用） */
  hint?: string
  /** 可核对来源；未外部核实的写「待核对」并说明依据类型 */
  evidence?: string
  /** verified = 已对照外部资料；pending = 仅依据形态规则，待补链接 */
  status?: 'verified' | 'pending'
  sourceUrl?: string
}
