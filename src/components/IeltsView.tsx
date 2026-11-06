import { formatPos } from '../pos'
import dagre from 'dagre'
import { ROOTS, EDGES as SEED_EDGES, WORDS as SEED_WORDS } from '../data/words'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import WordNode from './WordNode'
import MapEdge from './MapEdge'
import type { BookGroup, IeltsBook } from '../data/ieltsTypes'

const nodeTypes: NodeTypes = { word: WordNode }
const edgeTypes = { map: MapEdge }


function wordNode(
  w: string,
  x: number,
  y: number,
  book: IeltsBook,
  center: string | null,
  viewing: string | null,
  onPick: (w: string, asCenter: boolean) => void,
): Node {
  const entry = book.words[w]
  const seed = SEED_WORDS.find(x=>x.id===w)
  const isCenter = center === w
  return {
    id: w,
    type: 'word',
    position: { x, y },
    draggable: false,
    selectable: false,
    data: {
      word: w,
      pos: formatPos(seed?.pos ?? entry?.pos ?? '词性待补'),
      gloss: seed?.gloss ?? entry?.zh ?? '释义暂未收录',
      ipa: seed?.ipa ?? entry?.ipa ?? '',
      isRoot: false,
      isCenter,
      isSelected: viewing === w && !isCenter,
      hasChildren: false,
      expanded: false,
      childCount: 0,
      isBridge: !entry?.t,
      badge: entry?.t ? '目标' : '扩展',
      onToggle: () => {},
      onSelect: (id: string) => onPick(id, false),
      onCenter: (id: string) => onPick(id, true),
    },
  }
}

function seedRoot(word: string) {
  let current=word
  const seen=new Set<string>()
  while(!seen.has(current)) {
    seen.add(current)
    const root=ROOTS.find(r=>r.id===current)
    if(root) return root
    const edge=SEED_EDGES.find(e=>e.to===current)
    if(!edge) return undefined
    current=edge.from
  }
  return undefined
}
function rootsFor(g:BookGroup) {
  const roots=(g.roots ?? []).map(r=>({...r,memberWords:[...(r.memberWords ?? [])]}))
  for(const w of g.members) {
    const r=seedRoot(w)
    if(!r) continue
    const existing=roots.find(x=>x.id===r.id || x.label===r.label)
    if(existing) { if(!existing.memberWords?.includes(w)) existing.memberWords=[...(existing.memberWords ?? []),w] }
    else roots.push({id:r.id,label:r.label,meaning:r.gloss,origin:r.origin,memberWords:[w],source:'已核对示范词族'})
  }
  return roots
}
function treeLayout(g: BookGroup, pageIndex: number, book: IeltsBook, center: string | null, viewing: string | null,
  onPick: (w: string, asCenter: boolean) => void, rootsOpen: boolean, expandedForms: Set<string>, onToggleForm:(id:string)=>void) {
  const members = [...(g.pages[pageIndex] ?? [])]
  const effectiveCenter = center && members.includes(center) ? center : members[0]
  if (!effectiveCenter) return { nodes: [] as Node[], edges: [] as Edge[], center: undefined }
  if (g.kind === 'pending' || g.kind === 'word') return {
    nodes: members.map((w,i) => wordNode(w, (i%3)*310, Math.floor(i/3)*138, book, center, viewing, onPick)),
    edges: [] as Edge[], center: effectiveCenter,
  }
  type Link = {from:string;to:string;kind:string;label?:string;status?:string}
  const memberSet = new Set(members)
  const familyRoots = rootsFor(g)
  if(rootsOpen) {
    const labels=new Set(familyRoots.map(r=>r.label))
    for(const other of book.groups) for(const r of other.roots ?? []) if(labels.has(r.label)) {
      for(const w of r.memberWords ?? []) if(book.words[w]) { memberSet.add(w); const root=familyRoots.find(x=>x.label===r.label); if(root && !root.memberWords.includes(w)) root.memberWords.push(w) }
    }
    const seedIds=new Set(familyRoots.map(r=>r.id).filter(Boolean))
    for(const w of SEED_WORDS) if(book.words[w.id] && seedIds.has(seedRoot(w.id)?.id)) memberSet.add(w.id)
  }
  const candidates: Link[] = [...(g.curatedEdges ?? []), ...SEED_EDGES.filter(e=>e.kind!=='etymology'), ...(g.inflectionEdges ?? [])]
  // Include an attested parent so that inflections never hang from the selected sibling.
  for (const e of candidates) if (e.kind!=='association' && memberSet.has(e.to) && book.words[e.from]) memberSet.add(e.from)
  const incoming = new Set<string>()
  const links: Link[] = []
  const edgeKeys = new Set<string>()
  for (const e of candidates) {
    if (!memberSet.has(e.from) || !memberSet.has(e.to) || e.from === e.to) continue
    const key = `${e.from}:${e.to}`
    if (edgeKeys.has(key)) continue
    edgeKeys.add(key); incoming.add(e.to); links.push(e)
  }
  const inflectionLinks = links.filter(e=>e.kind==='inflection')
  const hidden = new Set(inflectionLinks.filter(e=>!expandedForms.has(e.from) && e.to!==effectiveCenter && !book.words[e.to]?.t).map(e=>e.to))
  for(const id of hidden) memberSet.delete(id)
  const retained=links.filter(e=>memberSet.has(e.from)&&memberSet.has(e.to))
  links.splice(0,links.length,...retained)
  const outCount = (w:string) => links.filter(e=>e.from===w).length
  const bases = [...memberSet].filter(w=>!incoming.has(w)).sort((a,b)=>outCount(b)-outCount(a) || a.length-b.length)
  const rootAttested=(w:string)=>familyRoots.slice(0,1).some(r=>r.memberWords.includes(w) || (r.id && seedRoot(w)?.id===r.id))
  const base = bases.find(rootAttested) ?? (!incoming.has(effectiveCenter) ? effectiveCenter : bases[0] ?? effectiveCenter)
  // An unverified family connection remains explicitly undirected, even in a left-to-right layout.
  // All displayed relationships are attested; no synthetic edges between unrelated bases.
  const rootList = familyRoots.filter(r => !r.memberWords?.length || r.memberWords.some(w=>memberSet.has(w)))
  const shownRoots = rootList.slice(0,1)
  const rootNodes: Node[] = shownRoots.map(r=>({id:`root:${r.id ?? r.label}`,type:'word',position:{x:0,y:0},draggable:false,selectable:false,
    data:{word:r.label,pos:'词根',gloss:[r.meaning,r.origin].filter(Boolean).join(' · '),ipa:'',isRoot:true,isCenter:false,isSelected:false,
      hasChildren:false,expanded:false,childCount:0,onToggle:()=>{},onSelect:()=>{},onCenter:()=>{}}}))
  for (const r of shownRoots) {
    const rootId = `root:${r.id ?? r.label}`
    // Connect only entries explicitly attested in this root source.
    const destinations = [...new Set([...(r.memberWords ?? [base]), ...(rootsOpen && r.id ? [...memberSet].filter(w=>seedRoot(w)?.id===r.id) : [])])].filter(w=>memberSet.has(w) && !incoming.has(w))
    for (const w of destinations) links.push({from:rootId,to:w,kind:'etymology',label:'源自'})
  }
  const nodes = [...memberSet].map(w=>{
    const n=wordNode(w,0,0,book,center,viewing,onPick)
    const children=inflectionLinks.filter(e=>e.from===w)
    n.data={...n.data,hasChildren:children.length>0,childCount:children.length,expanded:expandedForms.has(w),onToggle:onToggleForm}
    return n
  }).concat(rootNodes)
  const graph = new dagre.graphlib.Graph()
  graph.setGraph({rankdir:'LR',nodesep:30,ranksep:96,marginx:24,marginy:24})
  graph.setDefaultEdgeLabel(()=>({}))
  for (const n of nodes) graph.setNode(n.id,{width:258,height:116})
  for (const e of links) graph.setEdge(e.from,e.to)
  dagre.layout(graph)
  for (const n of nodes) {const pt=graph.node(n.id);n.position={x:pt.x-129,y:pt.y-58}}
  const edges: Edge[] = links.map(e=>({id:`${e.kind}:${e.from}:${e.to}`,source:e.from,target:e.to,
    sourceHandle:'out-right',targetHandle:'in-left',type:'map',data:{kind:e.kind,label:e.label ?? (e.kind==='inflection'?'词形变化':''),verified:e.status==='verified'}}))
  return {nodes,edges,center:effectiveCenter}
}

function Canvas(props: {
  book: IeltsBook
  group: BookGroup
  pageIndex: number
  center: string | null
  viewing: string | null
  onPick: (word: string, asCenter: boolean) => void
}) {
  const { book, group, pageIndex, center, viewing, onPick } = props
  const [rootsOpen, setRootsOpen] = useState(false)
  const [expandedForms,setExpandedForms]=useState<Set<string>>(()=>new Set(center?[center]:[]))
  const onToggleForm=useCallback((id:string)=>setExpandedForms(prev=>{const next=new Set(prev);if(next.has(id)) next.delete(id);else next.add(id);return next}),[])
  useEffect(()=>{setExpandedForms(new Set(center?[center]:[]));setRootsOpen(false)},[group.id,pageIndex,center])
  const layout = useMemo(() => treeLayout(group,pageIndex,book,center,viewing,onPick,rootsOpen,expandedForms,onToggleForm),[group,pageIndex,book,center,viewing,onPick,rootsOpen,expandedForms,onToggleForm])
  const centerWord = layout.center
  const edges = layout.edges

  const instance = useReactFlow()
  const lastKey = useRef('')
  const wrapRef = useRef<HTMLDivElement | null>(null)

  // 待整理页没有“中心”概念：用当前查看词兜底，保证搜到的词一定在视野内
  const focusId = centerWord ?? center ?? group.pages[pageIndex]?.[0]

  const focus = useCallback(() => {
    instance.fitView({ padding: 0.14, minZoom: 0.8, maxZoom: 1, duration: 0 })
    requestAnimationFrame(() => {
      const node = instance.getNode(focusId ?? '')
      if (!node) return
      const width = node.measured?.width ?? 258
      const height = node.measured?.height ?? 110
      const zoom = Math.max(0.8, Math.min(1, instance.getViewport().zoom))
      const bounds=wrapRef.current?.getBoundingClientRect()
      const all=instance.getNodes()
      const graphWidth=Math.max(...all.map(n=>n.position.x+(n.measured?.width??258)))-Math.min(...all.map(n=>n.position.x))
      const graphHeight=Math.max(...all.map(n=>n.position.y+(n.measured?.height??116)))-Math.min(...all.map(n=>n.position.y))
      if(bounds && graphWidth*zoom<=bounds.width*0.9 && graphHeight*zoom<=bounds.height*0.9) return
      if(bounds) instance.setViewport({x:bounds.width*0.38-(node.position.x+width/2)*zoom,y:bounds.height/2-(node.position.y+height/2)*zoom,zoom},{duration:0})
    })
  }, [focusId, instance])

  useEffect(() => {
    const key = `${group.id}|${pageIndex}|${focusId ?? ''}|${layout.nodes.map(n=>`${n.id}:${n.position.x}:${n.position.y}`).join(';')}`
    if (lastKey.current === key) return
    lastKey.current = key
    const id = window.setTimeout(focus, 30)
    return () => window.clearTimeout(id)
  }, [group.id, pageIndex, focusId, focus, layout.nodes])

  useEffect(()=>{
    const el=wrapRef.current
    if(!el) return
    let frame=0
    const ro=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(focus)})
    ro.observe(el)
    return()=>{ro.disconnect();cancelAnimationFrame(frame)}
  },[focus])

  const lastTap = useRef<{ id: string; at: number }>({ id: '', at: 0 })

  return (
    <div className="wt-flow" ref={wrapRef}>
    <ReactFlow
      nodes={layout.nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.14, minZoom: 0.8, maxZoom: 1 }}
      minZoom={0.35}
      maxZoom={2.2}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      elementsSelectable
      zoomOnDoubleClick={false}
      onNodeClick={(_, node) => {
        if (node.id.startsWith('root:')) { setRootsOpen(v=>!v); return }
        const now = Date.now()
        const prev = lastTap.current
        if (prev.id === node.id && now - prev.at < 380) {
          lastTap.current = { id: '', at: 0 }
          onPick(node.id, true)
        } else {
          lastTap.current = { id: node.id, at: now }
          onPick(node.id, false)
        }
      }}
    >
      <Background gap={24} size={1} color="#dce3ed" />
      <Controls showInteractive={false} showFitView={false} />
      <div className="wt-view-actions">{rootsFor(group).length>0 && <button type="button" onClick={()=>setRootsOpen(v=>!v)}>{rootsOpen ? '收起同根词' : '展开同根词'}</button>}
        <button type="button" onClick={focus}>阅读视图</button>
        <button type="button" onClick={() => instance.fitView({ padding: 0.08, duration: 280 })}>看全图</button>
      </div>
    </ReactFlow>
    </div>
  )
}

export default function IeltsView(props: {
  book: IeltsBook
  groupIndex: number
  pageIndex: number
  center: string | null
  viewing: string | null
  onPick: (word: string, asCenter: boolean) => void
}) {
  const { book, groupIndex } = props
  const group = book.groups[groupIndex]
  if (!group) return null
  return (
    <ReactFlowProvider>
      <Canvas {...props} group={group} />
    </ReactFlowProvider>
  )
}
