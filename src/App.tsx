import { formatPos } from './pos'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import WordNode from './components/WordNode'
import MapEdge from './components/MapEdge'
import IeltsApp from './components/IeltsApp'
import { ancestorChain, buildFlow, buildIndex, EDGE_COLOR, EDGE_LABEL, type Index } from './graph'
import { EDGES, ROOTS, WORDS } from './data/words'
import type { RootEntry, WordEntry } from './types'

const nodeTypes: NodeTypes = { word: WordNode }
const edgeTypes = { map: MapEdge }
const FAV_KEY = 'wt.favorites.v1'
const DONE_KEY = 'wt.mastered.v1'

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string' && x.length > 0) : [])
  } catch {
    return new Set()
  }
}

function saveSet(key: string, value: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...value]))
  } catch {
    /* 存储不可用时保持内存态 */
  }
}

function speak(word: string) {
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const utter = new SpeechSynthesisUtterance(word)
    utter.lang = 'en-GB'
    utter.rate = 0.9
    synth.speak(utter)
  } catch {
    /* 没有语音合成就安静跳过 */
  }
}

function TreeCanvas(props: {
  index: Index
  centerId: string
  selectedId: string
  expanded: Set<string>
  onToggle: (id: string) => void
  onPick: (id: string, asCenter?: boolean) => void
}) {
  const { index, centerId, selectedId, expanded, onToggle, onPick } = props
  const lastTap = useRef<{ id: string; at: number }>({ id: '', at: 0 })

  const flow = useMemo(
    () =>
      buildFlow({
        index,
        centerId,
        expanded,
        selectedId,
        onToggle,
        onSelect: (id: string) => onPick(id, false),
        onCenter: (id: string) => onPick(id, true),
      }),
    [index, centerId, expanded, selectedId, onToggle, onPick],
  )
  const instance = useReactFlow()
  const lastCenter = useRef('')
  const wrapRef = useRef<HTMLDivElement | null>(null)

  /**
   * 统一取景：
   * 1) fitView 显式带 minZoom=0.8（只设 ReactFlow 的 maxZoom 不会阻止 fit 缩小）
   * 2) 之后把当前中心词拉到视野中央，超宽图靠平移看其余部分
   * 3) 「看全图」是独立按钮，只有那里才允许缩到 0.35
   */
  const focusView = useCallback(() => {
    const node = instance.getNode(centerId)
    const bounds = wrapRef.current?.getBoundingClientRect()
    if (!node || !bounds) return
    const width = node.measured?.width ?? 258
    const height = node.measured?.height ?? 116
    // A new center really is the visual center. Never fit a tall branch into tiny text.
    const cx = node.position.x + width / 2, cy = node.position.y + height / 2
    const nodes = instance.getNodes()
    const halfW = Math.max(...nodes.map(n => Math.max(Math.abs(n.position.x-cx), Math.abs(n.position.x+(n.measured?.width ?? 258)-cx))))
    const halfH = Math.max(...nodes.map(n => Math.max(Math.abs(n.position.y-cy), Math.abs(n.position.y+(n.measured?.height ?? 116)-cy))))
    const zoom = Math.max(0.8, Math.min(1, (bounds.width-40)/(halfW*2), (bounds.height-48)/(halfH*2)))
    instance.setViewport({x: (bounds.width-width*zoom)/2-node.position.x*zoom,
      y: (bounds.height-height*zoom)/2-node.position.y*zoom, zoom}, {duration: 0})
  }, [centerId, instance])

  // 切换树心时重新取景；展开/收起不移动画面，避免节点在鼠标下跳
  useEffect(() => {
    if (!flow.nodes.length) return
    if (lastCenter.current === centerId) return
    lastCenter.current = centerId
    const id = window.setTimeout(focusView, 30)
    return () => window.clearTimeout(id)
  }, [flow.nodes.length, centerId, focusView])

  // 窗口变小/侧栏换行时同样按规则取景（不能缩成小字）
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    let raf = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => focusView())
    })
    observer.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [focusView])

  return (
    <div className="wt-flow" ref={wrapRef}>
    <ReactFlow
      nodes={flow.nodes as Node[]}
      edges={flow.edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.12, minZoom: 0.8, maxZoom: 1 }}
      minZoom={0.35}
      maxZoom={2.2}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      elementsSelectable
      zoomOnDoubleClick={false}
      onNodeClick={(_, node) => {
        const now = Date.now()
        const prev = lastTap.current
        // 两次点同一节点且间隔 < 380ms → 以它为中心；否则只是查看
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
      <div className="wt-view-actions"><button type="button" onClick={focusView}>阅读视图</button><button type="button" className="wt-fitall" onClick={() => instance.fitView({ padding: 0.08, duration: 280 })}>
        看全图
      </button></div>
    </ReactFlow>
    </div>
  )
}

export default function App() {
  const index = useMemo(() => buildIndex(WORDS, EDGES, ROOTS), [])
  const [centerId, setCenterId] = useState('art')
  const [selectedId, setSelectedId] = useState('art')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['art']))
  const [history, setHistory] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [searchError, setSearchError] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(() => loadSet(FAV_KEY))
  const [mastered, setMastered] = useState<Set<string>>(() => loadSet(DONE_KEY))
  const [book, setBook] = useState<'demo' | 'ielts'>(() => { try { return localStorage.getItem('wt.book.v1') === 'demo' ? 'demo' : 'ielts' } catch { return 'ielts' } })
  useEffect(() => { try { localStorage.setItem('wt.book.v1', book) } catch { /* Memory-only mode */ } }, [book])

  const viewingWord: WordEntry | undefined = index.rootsById.has(selectedId)
    ? undefined
    : (index.byId.get(selectedId) ?? index.byId.get(centerId))
  const viewingRoot: RootEntry | undefined = index.rootsById.get(selectedId)
  const viewing = viewingWord

  const goCenter = useCallback(
    (id: string) => {
      if (!index.byId.has(id)) return
      if (id !== centerId) {
        setHistory((h) => [...h, centerId].slice(-20))
        setCenterId(id)
      }
      setSelectedId(id)
      setExpanded(new Set([id]))
    },
    [index, centerId],
  )

  /** 单击 = 查看；双击 = 设为中心 */
  const onPick = useCallback(
    (id: string, asCenter = false) => {
      // 点词根：选中它并直接展开/收起同根分支（词根不能当树心）
      if (index.rootsById.has(id)) {
        setSelectedId(id)
        if (asCenter) {
          setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
          })
        }
        return
      }
      if (asCenter) goCenter(id)
      else setSelectedId(id)
    },
    [goCenter, index],
  )

  const onToggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const back = useCallback(() => {
    const last = history[history.length - 1]
    if (!last) return
    setHistory(history.slice(0, -1))
    setCenterId(last)
    setSelectedId(last)
    setExpanded(new Set([last]))
    setSearchError('')
  }, [history])

  const searchHit = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return WORDS.filter((w) => w.word.toLowerCase().startsWith(q) || w.gloss.includes(q)).slice(0, 8)
  }, [query])

  const exact = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return undefined
    return WORDS.find((w) => w.word.toLowerCase() === q)
  }, [query])

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveSet(FAV_KEY, next)
      return next
    })
  }

  function toggleMastered(id: string) {
    setMastered((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveSet(DONE_KEY, next)
      return next
    })
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      favorites: [...favorites],
      mastered: [...mastered],
    }
    const filename = `word-tree-progress-${new Date().toISOString().slice(0, 10)}.json`
    const contents = JSON.stringify(payload, null, 2)
    if (window.wordTreeDesktop) {
      window.wordTreeDesktop.saveJSON(filename, contents)
      return
    }
    const blob = new Blob([contents], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  function importData(file: File) {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.favorites) || !Array.isArray(parsed.mastered)
          || ![...parsed.favorites, ...parsed.mastered].every((id: unknown) => typeof id === 'string' && id.length > 0)) {
          throw new Error('Invalid progress')
        }
        const response = await fetch('/data/ielts-index.json')
        if (!response.ok) throw new Error('Index unavailable')
        const doc = await response.json() as {index: [string, number, number][]}
        const known = new Set([...WORDS.map(w => w.id), ...doc.index.map(row => row[0])])
        if (![...parsed.favorites, ...parsed.mastered].every((id: string) => known.has(id))) throw new Error('Unknown word')
        const fav = new Set<string>(parsed.favorites)
        const done = new Set<string>(parsed.mastered)
        setFavorites(fav)
        setMastered(done)
        saveSet(FAV_KEY, fav)
        saveSet(DONE_KEY, done)
        setNotice(`已导入：收藏 ${fav.size} 个，已掌握 ${done.size} 个`)
      } catch {
        setNotice('导入失败：文件格式或词条无效，原有进度已保留')
      }
    }
    reader.readAsText(file)
  }

  const unknown = Boolean(searchError)
  const root = useMemo(() => rootOf(index, selectedId), [index, selectedId])
  const incoming = index.parents.get(selectedId) ?? []

  // 当前查看词共享的词根，以及它下面「别的分支」有多少个（同根词入口用）
  const siblingRoot = viewingWord ? rootOf(index, viewingWord.id) : viewingRoot
  const siblingCount = siblingRoot
    ? (index.children.get(siblingRoot.id) ?? []).filter((e) => e.to !== viewingWord?.id && !ancestorChain(index, selectedId).includes(e.to)).length
    : 0

  if (book === 'ielts') {
    return (
      <> <IeltsApp
        favorites={favorites}
        mastered={mastered}
        onToggleFav={toggleFavorite}
        onToggleMastered={toggleMastered}
        onExport={exportData}
        onImport={importData}
        onBackToDemo={() => setBook('demo')}
      />{notice && <div role="status" className="wt-notice" onClick={() => setNotice('')}>{notice} · 点击关闭</div>}</>
    )
  }

  return (
    <div className={`wt-app ${detailsOpen ? '' : 'details-hidden'}`}>
      <header className="wt-header">
        <div className="wt-brand">
          <span className="wt-logo" aria-hidden="true">w.</span>
          <div>
            <h1>单词树</h1>
            <p>WORD TREE / 词族探索</p>
          </div>
        </div>

        <div className="wt-search">
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setSearchError('') }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') { setQuery(''); setSearchError(''); return }
              if (event.key !== 'Enter') return
              const hit = exact ?? searchHit[0]
              if (hit) {
                goCenter(hit.id)
                setQuery(''); setSearchError('')
              } else if (query.trim()) setSearchError(query.trim())
            }}
            placeholder="搜索单词或中文释义…"
            aria-label="搜索单词"
          />
          <button
            type="button"
            className="wt-btn primary"
            onClick={() => {
              const hit = exact ?? searchHit[0]
              if (hit) {
                goCenter(hit.id)
                setQuery(''); setSearchError('')
              } else if (query.trim()) setSearchError(query.trim())
            }}
          >
            搜索
          </button>
          {query && <button type="button" className="wt-clear" aria-label="清空搜索" onClick={() => { setQuery(''); setSearchError('') }}>×</button>}
          {searchHit.length > 0 ? (
            <ul className="wt-suggest">
              {searchHit.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      goCenter(m.id)
                      setQuery(''); setSearchError('')
                    }}
                  >
                    <b>{m.word}</b>
                    <span>{m.gloss}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="wt-actions"><button type="button" className="wt-btn focus-toggle" aria-pressed={!detailsOpen} onClick={() => setDetailsOpen(v => !v)}>{detailsOpen ? '专注导图' : '展开详情'}</button>
          <button type="button" className="wt-btn primary" onClick={() => setBook('ielts')}>
            雅思词族
          </button>
          <button type="button" className="wt-btn" onClick={back} disabled={!history.length}>
            ← 返回
          </button>
          <button type="button" className="wt-btn" onClick={exportData}>
            导出进度
          </button>
          <label className="wt-btn file">
            导入进度
            <input
              type="file"
              accept="application/json"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) importData(file)
                event.target.value = ''
              }}
            />
          </label>
        </div>
      </header>

      {notice ? (
        <div role="status" className="wt-notice" onClick={() => setNotice('')}>
          {notice} · 点击关闭
        </div>
      ) : null}

      <section className="wt-current">
        <div className="wt-current-main">
          <div className="wt-current-word">
            <h2>{viewing?.word ?? viewingRoot?.label ?? '—'}</h2>
            {viewing?.ipa ? <span className="wt-ipa-lg">{viewing.ipa}</span> : null}
            <button
              type="button"
              className="wt-btn ghost"
              onClick={() => viewing && speak(viewing.word)}
              title="用系统语音朗读（英式）"
            >
              ▷ 发音
            </button>
            <span className="wt-tag">{viewing?.pos ? formatPos(viewing.pos) : (viewingRoot ? '词根' : '')}</span>
            {viewing ? <span className="wt-tag family">词族：{viewing.family}</span> : null}
            {viewingRoot ? <span className="wt-tag family">共同来源</span> : null}
            {viewing && viewing.id === centerId ? <span className="wt-tag center">当前中心</span> : null}
            {viewingRoot && selectedId === centerId ? <span className="wt-tag center">这个词根是树心</span> : null}
          </div>
          <p className="wt-current-gloss">{viewing?.gloss ?? viewingRoot?.origin}</p>
          {viewing?.note ? <p className="wt-current-note">{viewing.note}</p> : null}
          {viewingRoot ? (
            <p className="wt-current-note">
              词根条目，没有独立释义；含 {index.children.get(viewingRoot.id)?.length ?? 0} 个分支，点下面按钮可一次展开。
            </p>
          ) : null}
        </div>
        <div className="wt-current-side">
          {viewingRoot ? (
            <button type="button" className={`wt-btn wide ${expanded.has(viewingRoot.id) ? 'on' : ''}`} onClick={() => onToggle(viewingRoot.id)}>
              {expanded.has(viewingRoot.id)
                ? `收起同根词（${index.children.get(viewingRoot.id)?.length ?? 0}）`
                : `展开同根词（${index.children.get(viewingRoot.id)?.length ?? 0}）`}
            </button>
          ) : null}
          {viewing ? (
            <>
              <button
                type="button"
                className={`wt-btn ${favorites.has(viewing.id) ? 'on' : ''}`}
                onClick={() => toggleFavorite(viewing.id)}
              >
                {favorites.has(viewing.id) ? '★ 已收藏' : '☆ 收藏'}
              </button>
              <button
                type="button"
                className={`wt-btn ${mastered.has(viewing.id) ? 'on' : ''}`}
                onClick={() => toggleMastered(viewing.id)}
              >
                {mastered.has(viewing.id) ? '✓ 已掌握' : '○ 标记已掌握'}
              </button>
              {viewing.id !== centerId ? (
                <button type="button" className="wt-btn wide" onClick={() => goCenter(viewing.id)}>
                  以「{viewing.word}」为中心
                </button>
              ) : null}
              {siblingRoot && siblingCount > 0 ? (
                <button
                  type="button"
                  className={`wt-btn wide ${expanded.has(siblingRoot.id) ? 'on' : ''}`}
                  onClick={() => onToggle(siblingRoot.id)}
                >
                  {expanded.has(siblingRoot.id)
                    ? `收起同根词（${siblingCount}）`
                    : `展开同根词（${siblingCount}）`}
                </button>
              ) : null}
              <div className="wt-progress">
                收藏 {favorites.size} · 掌握 {mastered.size}
              </div>
            </>
          ) : null}
        </div>
      </section>

      <div className="wt-body">
        <main className="wt-tree">
          <div className="wt-tree-toolbar"><div className="wt-family-nav" aria-label="示范词族">{['art', 'create', 'act', 'write'].map(f => <button type="button" key={f} className={index.byId.get(centerId)?.family === f ? 'active' : ''} onClick={() => { goCenter(f); setSearchError(''); setQuery('') }}>{f}</button>)}</div><span className="wt-group-count">{index.byId.get(centerId)?.family} 词族 · {WORDS.filter(w => w.family === index.byId.get(centerId)?.family).length} 词</span><div className="wt-legend">
            <span><i style={{ background: EDGE_COLOR.derivation }} />派生</span>
            <span><i style={{ background: EDGE_COLOR.inflection }} />词形变化</span>
            <span><i style={{ background: EDGE_COLOR.etymology }} />词源</span>
            
          </div></div>
          {unknown ? (
            <div className="wt-empty">
              <h3>没有收录「{searchError}」</h3><button type="button" className="wt-btn" onClick={() => { setQuery(''); setSearchError('') }}>返回词族树</button>
              <p>
                当前有 {WORDS.length} 个示范词。试试 art、create、act 或 write。
              </p>
              {searchHit.length ? (
                <p>相近的：{searchHit.map((m) => m.word).join('、')}</p>
              ) : (
                <p>换一个词试试，或者先按词根搜。</p>
              )}
            </div>
          ) : (
            <ReactFlowProvider>
              <TreeCanvas
                index={index}
                centerId={centerId}
                selectedId={selectedId}
                expanded={expanded}
                onToggle={onToggle}
                onPick={onPick}
              />
            </ReactFlowProvider>
          )}
        </main>

        <aside className="wt-side">
          <h3>词组搭配</h3>
          {viewing && viewing.collocations.length ? (
            <ul className="wt-colloc">
              {viewing.collocations.map((c) => (
                <li key={c.phrase}>
                  <b>{c.phrase}</b>
                  <span>{c.zh}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="wt-muted">{viewing ? '这个词暂时没有核对过的固定搭配。' : '点树上的词看搭配。'}</p>
          )}

      <section className="wt-examples">
        <h3>
          双语例句 {viewing ? <span className="wt-badge-self">自编例句</span> : null}
          
        </h3>
        {viewing && viewing.examples.length ? (
          <ol>
            {viewing.examples.map((ex, i) => (
              <li key={i}>
                <p className="wt-ex-en">{ex.en}</p>
                <p className="wt-ex-zh">{ex.zh}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="wt-muted">这个词还没有例句。</p>
        )}
      </section>
          <details className="wt-reference"><summary>构词与来源<span>展开</span></summary>
          <h3>词族构成</h3>
          {viewing ? (
            <div className="wt-facts">
              <div><span>词性</span><b>{formatPos(viewing.pos)}</b></div>
              <div><span>词族</span><b>{viewing.family}</b></div>
              <div>
                <span>词根</span>
                <b>{root ? `${root.label}｜${root.origin}` : '本版未收录上游词根'}</b>
              </div>
            </div>
          ) : null}

          <h3>关系与来源</h3>
          {incoming.length ? (
            <ul className="wt-relations">
              {incoming.map((edge) => (
                <li key={`${edge.from}-${edge.to}-${edge.kind}`}>
                  <div className="wt-rel-head">
                    <span className="wt-rel-kind" style={{ color: EDGE_COLOR[edge.kind] }}>
                      {EDGE_LABEL[edge.kind]}
                    </span>
                    <span>
                      {edge.kind === 'etymology'
                        ? `${edge.to} 源自 ${edgeLabel(index, edge.from)}`
                        : `${edge.from} → ${edge.to}`}
                    </span>
                    <span className={`wt-rel-status ${edge.status === 'verified' ? 'ok' : 'pending'}`}>
                      {edge.status === 'verified' ? '已核实' : '待核对'}
                    </span>
                  </div>
                  <p className="wt-rel-note">
                    {edge.label ? edge.label + '；' : ''}
                    {edge.evidence ?? '依据形态变化规则，尚未补外部链接'}
                    {edge.sourceUrl ? (
                      <>
                        {' '}
                        <a href={edge.sourceUrl} target="_blank" rel="noreferrer">核对</a>
                      </>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="wt-muted">这个词是词族起点，没有上游关系。</p>
          )}

          </details>
          <h3>已收藏</h3>
          {favorites.size ? (
            <ul className="wt-mini-list">
              {[...favorites].map((id) => {
                const w = index.byId.get(id)
                if (!w) return null
                return (
                  <li key={id}>
                    <button type="button" onClick={() => { goCenter(id); setSearchError('') }}>{w.word}</button>
                    <span>{w.gloss}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="wt-muted">还没有收藏的词，点上面 ☆ 收藏。</p>
          )}

        </aside>
      </div>


    </div>
  )
}

/** 上游端点名字：词根用「art-（拉丁 ars/art- 技艺）」，避免与 art 本体混淆 */
function edgeLabel(index: Index, from: string): string {
  const root = index.rootsById.get(from)
  if (root) return `${root.label}｜${root.origin}`
  return from
}

function rootOf(index: Index, id: string): RootEntry | undefined {
  const chain = ancestorChain(index, id)
  for (let i = chain.length - 1; i >= 0; i--) {
    const root = index.rootsById.get(chain[i])
    if (root) return root
  }
  return undefined
}
