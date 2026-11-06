import dagre from 'dagre'
import type { Edge as FlowEdge, Node as FlowNode } from '@xyflow/react'
import type { Edge, EdgeKind, RootEntry, WordEntry } from './types'
export type { EdgeKind } from './types'

export const NODE_W = 258
export const NODE_H = 116

export const EDGE_COLOR: Record<EdgeKind, string> = {
  derivation: '#2f6feb',
  inflection: '#0f9d58',
  etymology: '#b26a00',
  association: '#7a5cc4',
}

export const EDGE_LABEL: Record<EdgeKind, string> = {
  derivation: '派生',
  inflection: '变形',
  etymology: '词源',
  association: '词族关联',
}

export interface Index {
  byId: Map<string, WordEntry>
  rootsById: Map<string, RootEntry>
  parents: Map<string, Edge[]>
  children: Map<string, Edge[]>
}

export function buildIndex(words: WordEntry[], edges: Edge[], roots: RootEntry[]): Index {
  const byId = new Map(words.map((w) => [w.id, w]))
  const rootsById = new Map(roots.map((r) => [r.id, r]))
  const parents = new Map<string, Edge[]>()
  const children = new Map<string, Edge[]>()
  for (const edge of edges) {
    if (!byId.has(edge.to) && !rootsById.has(edge.to)) continue
    if (!byId.has(edge.from) && !rootsById.has(edge.from)) continue
    const p = parents.get(edge.to) ?? []
    p.push(edge)
    parents.set(edge.to, p)
    const c = children.get(edge.from) ?? []
    c.push(edge)
    children.set(edge.from, c)
  }
  return { byId, rootsById, parents, children }
}

/** 从任意词往上游走到词根，返回 [根, …, 中心] 的链路（取最短路径）。 */
export function ancestorChain(index: Index, id: string): string[] {
  if (!index.byId.has(id) && !index.rootsById.has(id)) return []
  const seen = new Set<string>([id])
  let cursor = id
  const chain = [id]
  for (let guard = 0; guard < 12; guard++) {
    const incoming = index.parents.get(cursor)
    if (!incoming || incoming.length === 0) break
    // 优先走词源/派生主链，避开仅有的变形关系
    const next =
      incoming.find((e) => e.kind === 'etymology') ??
      incoming.find((e) => e.kind === 'derivation') ??
      incoming[0]
    if (!next || seen.has(next.from)) break
    seen.add(next.from)
    chain.unshift(next.from)
    cursor = next.from
  }
  return chain
}

export interface BuildOptions {
  centerId: string
  expanded: Set<string>
  selectedId: string
  index: Index
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onCenter: (id: string) => void
}

export function buildFlow(opts: BuildOptions): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const { centerId, expanded, selectedId, index } = opts
  if (!index.byId.has(centerId)) return { nodes: [], edges: [] }

  const chain = ancestorChain(index, centerId)
  const visible = new Set<string>(chain)

  // 同源借词：把词根下的其它分支也摆出来（artificial / artifice / artisan 这类
  // 不是从 art 派生、而是与 art 同源的词，只能从词根这一层看见）
  // 只有用户主动展开词根时才铺开同源分支，否则默认只给「上游链 + 中心的下游」，
  // 避免 artist 居中时被一大堆同源借词挤到必须缩得很小才能看全。
  const rootId = chain[0]
  if (rootId && chain.length > 1 && expanded.has(rootId)) {
    for (const edge of (index.children.get(rootId) ?? [])) visible.add(edge.to)
  }

  // 展开扩散：对所有「可见且被展开」的节点反复补子节点，
  // 这样同根兄弟（artificial 等）展开后也能把 artificially 带出来
  const processed = new Set<string>()
  const work = [...visible]
  while (work.length) {
    const id = work.shift() as string
    if (processed.has(id)) continue
    processed.add(id)
    if (!expanded.has(id)) continue
    for (const edge of (index.children.get(id) ?? [])) {
      if (!visible.has(edge.to)) {
        visible.add(edge.to)
        work.push(edge.to)
      }
    }
  }

  const ids = [...visible].filter(id => index.byId.has(id) || index.rootsById.has(id))
  // Re-root the visible relationship graph at the selected center, then balance
  // whole branches across both sides. Linguistic edge direction stays intact.
  const relations = ids.flatMap(id => (index.parents.get(id) ?? []).filter(e => visible.has(e.from)))
  const graph = new dagre.graphlib.Graph()
  graph.setGraph({rankdir:'LR',nodesep:30,ranksep:96,marginx:24,marginy:24})
  graph.setDefaultEdgeLabel(()=>({}))
  for (const id of ids) graph.setNode(id,{width:NODE_W,height:NODE_H})
  for (const e of relations) graph.setEdge(e.from,e.to)
  dagre.layout(graph)
  const positions = new Map<string,{x:number;y:number}>()
  for (const id of ids) {const pt=graph.node(id);positions.set(id,{x:pt.x,y:pt.y})}
  const flowEdges: FlowEdge[] = relations.map(edge => {
    const from = positions.get(edge.from)!, to = positions.get(edge.to)!
    const rightward = to.x >= from.x
    return {
      id: `${edge.from}->${edge.to}:${edge.kind}`, source: edge.from, target: edge.to,
      sourceHandle: rightward ? 'out-right' : 'out-left',
      targetHandle: rightward ? 'in-left' : 'in-right', type: 'map',
      data: {kind: edge.kind, label: edge.label ?? EDGE_LABEL[edge.kind], hint: edge.hint ?? edge.evidence ?? '', verified: edge.status === 'verified', lane: 0},
    }
  })

  const flowNodes: FlowNode[] = ids.map((id) => {
    const pos = positions.get(id)
    const entry = index.byId.get(id)
    const root = index.rootsById.get(id)
    const kids = index.children.get(id) ?? []
    return {
      id,
      type: 'word',
      position: { x: (pos?.x ?? 0) - NODE_W / 2, y: (pos?.y ?? 0) - NODE_H / 2 },
      data: {
        word: entry?.word ?? root?.label ?? id,
        pos: entry?.pos ?? '词根',
        gloss: entry?.gloss ?? root?.gloss ?? '',
        ipa: entry?.ipa ?? '',
        isRoot: Boolean(root),
        isCenter: id === centerId,
        isSelected: id === selectedId,
        hasChildren: kids.length > 0,
        expanded: expanded.has(id),
        childCount: kids.length,
        onToggle: opts.onToggle,
        onSelect: opts.onSelect,
        onCenter: opts.onCenter,
      },
      draggable: false,
      selectable: false,
    }
  })

  return { nodes: flowNodes, edges: flowEdges }
}
