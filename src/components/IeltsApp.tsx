import { formatPos } from '../pos'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import IeltsView from './IeltsView'
import { locateWord, pageCenter } from '../studyNavigation'
import { WORDS } from '../data/words'
import type { BookGroup, IeltsBook, IeltsIndex } from '../data/ieltsTypes'
import type { WordEntry } from '../types'

type FrequencyMode = 'all' | 'high' | 'other'
interface FrequencyDoc { counts: { targets:number; highTargets:number; otherTargets:number }; byWord:Record<string,{source:'ngsl';rank:number|null;matched:string;priority:number}> }

const curated = new Map<string, WordEntry>(WORDS.map((w) => [w.id, w]))

/** Wiktionary 语种代码 → 中文名（覆盖当前数据里出现的代码；不认识的回退成代码本身） */
const LANG_ZH: Record<string, string> = {
  enm: '中古英语', ang: '古英语', fro: '古法语', frm: '中古法语', fr: '法语',
  la: '拉丁语', 'la-lat': '拉丁语', 'la-med': '中古拉丁语', 'la-vul': '通俗拉丁语',
  'la-new': '新拉丁语', 'la-cla': '古典拉丁语', 'la-eme': '早期现代拉丁语', 'la-ecc': '教会拉丁语',
  grc: '古希腊语', 'ine-pro': '原始印欧语', 'gem-pro': '原始日耳曼语', 'gmw-pro': '原始西日耳曼语',
  'itc-pro': '原始意大利语', 'cel-pro': '原始凯尔特语', xno: '盎格鲁-诺曼语', non: '古诺尔斯语',
  frk: '法兰克语', it: '意大利语', dum: '中古荷兰语', nl: '荷兰语', de: '德语', gml: '中古低地德语',
  'fro-nor': '古诺曼法语', 'cel-gau': '高卢语', ar: '阿拉伯语', odt: '古荷兰语', pro: '古普罗旺斯语',
  osx: '古萨克森语', gem: '日耳曼语', es: '西班牙语', gmq: '北日耳曼语', 'roa-oit': '古意大利语',
  got: '哥特语', lng: '伦巴第语', goh: '古高地德语', ja: '日语', zh: '汉语', ru: '俄语', pt: '葡萄牙语',
}

function speak(word: string) {
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'en-GB'
    u.rate = 0.9
    synth.speak(u)
  } catch {
    /* 静默 */
  }
}

function baseWord(g: BookGroup): string {
  const pool = g.targets.length ? g.targets : g.members
  return [...pool].sort((a, b) => a.length - b.length || a.localeCompare(b))[0] ?? g.title
}

export default function IeltsApp(props: {
  favorites: Set<string>
  mastered: Set<string>
  onToggleFav: (id: string) => void
  onToggleMastered: (id: string) => void
  onExport: () => void
  onImport: (file: File) => void
  onBackToDemo: () => void
}) {
  const { favorites, mastered, onToggleFav, onToggleMastered, onExport, onImport, onBackToDemo } = props
  const [indexDoc, setIndexDoc] = useState<IeltsIndex | null>(null)
  const [book, setBook] = useState<IeltsBook | null>(null)
  const [themesDoc, setThemesDoc] = useState<{themes:{id:string;name:string;count:number;members:string[]}[];byWord:Record<string,{p:string;s:string[]}>} | null>(null)
  const [examplesDoc, setExamplesDoc] = useState<Record<string,{en:string;zh:string;sentenceUrl?:string;license?:string;source?:string;selfAuthored?:boolean;zhRevised?:boolean;collocations?:{phrase:string;zh:string}[]}[]>>({})
  const [etymDoc, setEtymDoc] = useState<Record<string,{chain:string[];text:string}>>({})
  const [libraryMode, setLibraryMode] = useState<'themes'|'families'>('themes')
  const [openThemes, setOpenThemes] = useState<Set<string>>(new Set())
  const [themeLimits, setThemeLimits] = useState<Record<string, number>>({})
  const [frequencyDoc,setFrequencyDoc]=useState<FrequencyDoc|null>(null)
  const [frequencyError,setFrequencyError]=useState(false)
  const [frequencyMode,setFrequencyMode]=useState<FrequencyMode>(()=>{try {const m=localStorage.getItem('wt.frequency.v1');return m==='high'||m==='other'?m:'all'}catch{return 'all'}})
  useEffect(()=>{try{localStorage.setItem('wt.frequency.v1',frequencyMode)}catch{}},[frequencyMode])
  const [loadError, setLoadError] = useState('')
  const [groupIndex, setGroupIndex] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [center, setCenter] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searchError, setSearchError] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [libraryOpen, setLibraryOpen] = useState(() => window.innerWidth >= 1100)
  const [libraryQuery, setLibraryQuery] = useState('')
  const [libraryLimit, setLibraryLimit] = useState(60)
  const [openGroups,setOpenGroups]=useState<Set<string>>(()=>new Set())
  const [directoryAnchor,setDirectoryAnchor]=useState<string|null>(null)
  const directoryRows=useRef(new Map<string,HTMLButtonElement>())
  const directoryScroll=useRef<HTMLDivElement|null>(null)
  const rowRef=(word:string)=>(node:HTMLButtonElement|null)=>{if(node)directoryRows.current.set(word,node);else directoryRows.current.delete(word)}
  const [history, setHistory] = useState<{ g: number; p: number; w: string }[]>([])

  useEffect(() => {
    let alive = true
    fetch('/data/ielts-frequency.json').then(r=>{if(!r.ok)throw new Error('frequency');return r.json()}).then(d=>{if(alive)setFrequencyDoc(d)}).catch(()=>{if(alive)setFrequencyError(true)})
    fetch('/data/ielts-themes.json').then(r=>r.json()).then(setThemesDoc).catch(()=>{})
    fetch('/data/ielts-examples.json').then(r=>r.json()).then((d)=>setExamplesDoc(d.perWord||{})).catch(()=>{})
    fetch('/data/ielts-etymology.json').then(r=>r.json()).then((d)=>setEtymDoc(d.perWord||{})).catch(()=>{})
    fetch('/data/ielts-book.json')
      .then((r) => r.json())
      .then((doc: IeltsBook) => {
        if (!alive) return
        setBook(doc)
        setIndexDoc({bookId:doc.bookId,meta:doc.meta,index:doc.index})
        let saved:string|null=null
        try {saved=localStorage.getItem('wt.selection.v2')}catch{}
        const w=saved && doc.words[saved] ? saved : doc.groups.find(g=>g.targets.length)?.targets[0] ?? null
        const loc=w ? locateWord(doc,w) : undefined
        setGroupIndex(loc?.[0]??0);setPageIndex(loc?.[1]??0)
        setCenter(w);setViewing(w)
      })
      .catch(() => alive && setLoadError('词库加载失败'))
    return () => {
      alive = false
    }
  }, [])

  useEffect(()=>{if(viewing){setDirectoryAnchor(viewing);setLibraryQuery('')}},[viewing])
  useEffect(()=>{if(center)try{localStorage.setItem('wt.selection.v2',center)}catch{}},[center])

  const group: BookGroup | undefined = book?.groups[groupIndex]
  const pageCount = group?.pages.length ?? 0
  useEffect(()=>{ if(group) setOpenGroups(prev=>new Set(prev).add(group.id)) },[group?.id])

  const wordLoc = useMemo(() => {
    const map = new Map<string, [number, number][]>()
    for (const [w, gi, pi] of indexDoc?.index ?? []) {
      const list = map.get(w)
      if (list) list.push([gi, pi])
      else map.set(w, [[gi, pi]])
    }
    return map
  }, [indexDoc])

  const jumpTo = useCallback(
    (word: string) => {
      const loc = wordLoc.get(word)
      if (!loc) return false
      const [gi, pi] = loc[0]
      if (center) setHistory((h) => [...h, { g: groupIndex, p: pageIndex, w: center }].slice(-20))
      setGroupIndex(gi)
      setPageIndex(pi)
      setCenter(word)
      setViewing(word)
      setDirectoryAnchor(word)
      setLibraryQuery('')
      return true
    },
    [wordLoc, center, groupIndex, pageIndex],
  )

  const suggestions = useMemo(() => {
    if (!indexDoc) return []
    const q = query.trim().toLowerCase()
    if (!q) return []
    const prefix: string[] = []
    const contains: string[] = []
    for (const [w] of indexDoc.index) {
      if (w.startsWith(q)) {
        prefix.push(w)
        if (prefix.length >= 8) break
      } else if (prefix.length < 8 && w.includes(q) && contains.length < 8) {
        contains.push(w)
      }
    }
    return [...prefix, ...contains].slice(0, 8)
  }, [indexDoc, query])

  const submitSearch = useCallback(() => {
    const q = query.trim().toLowerCase()
    if (!q) return
    // 精确命中优先，避免输入 act 却跳到 acting
    const exactHit = wordLoc.has(q) ? q : undefined
    const hit = exactHit ?? suggestions[0]
    if (hit && jumpTo(hit)) {
      setLibraryOpen(true)
      setQuery('')
      setSearchError('')
      return
    }
    setSearchError(/[\u4e00-\u9fff]/.test(q) ? '中文搜索暂未支持，请用英文词或更短的词干' : q)
  }, [query, wordLoc, suggestions, jumpTo])

  function goGroup(delta: number) {
    if (!navigationGroups.length)return
    const at=navigationGroups.findIndex(x=>x.gi===groupIndex)
    const next=at<0 ? (delta>0?0:navigationGroups.length-1) : (at+delta+navigationGroups.length)%navigationGroups.length
    jumpTo(navigationGroups[next].word)
  }
  function goPage(delta:number){
    if(!group)return
    const next=delta>0 ? nextPageIndex : previousPageIndex
    if(next===undefined)return
    const w=pageCenter(group,next)
    if(w)jumpTo(w)
  }

  const back = useCallback(() => {
    const last = history[history.length - 1]
    if (!last) return
    setHistory(history.slice(0, -1))
    setGroupIndex(last.g)
    setPageIndex(last.p)
    setCenter(last.w)
    setViewing(last.w)
    setDirectoryAnchor(last.w);setLibraryQuery('')
  }, [history])

  const onPick = useCallback((w: string, asCenter: boolean) => {
    if(asCenter){jumpTo(w);return}
    setViewing(w);setDirectoryAnchor(w);setLibraryQuery('')
  }, [jumpTo])

  const viewingWord = viewing ? book?.words[viewing] : undefined
  const viewingCurated = viewing ? curated.get(viewing) : undefined
  const groupTargets = group?.targets ?? []
  const doneTargets = groupTargets.filter((w) => mastered.has(w)).length

  const alsoIn = useMemo(() => {
    if (!book || !viewing) return []
    const out: BookGroup[] = []
    for (const g of book.groups) {
      if (g.id === group?.id) continue
      if (g.members.includes(viewing)) out.push(g)
    }
    return out.slice(0, 3)
  }, [book, viewing, group?.id])

  const meta = indexDoc?.meta

  const frequencyMatches = useCallback((w:string)=>frequencyMode==='all' || Boolean(frequencyDoc) && (frequencyMode==='high' ? Boolean(frequencyDoc?.byWord[w]) : !frequencyDoc?.byWord[w]),[frequencyMode,frequencyDoc])
  const prioritySort = useCallback((words:string[])=>[...words].sort((a,b)=>frequencyMode==='high' ? (frequencyDoc?.byWord[a]?.priority??Infinity)-(frequencyDoc?.byWord[b]?.priority??Infinity) || a.localeCompare(b) : a.localeCompare(b)),[frequencyMode,frequencyDoc])
  const anchorTopic=useMemo(()=>{
    if(!directoryAnchor || !book || !themesDoc)return undefined
    const w=book.words[directoryAnchor]
    const direct=themesDoc.byWord[directoryAnchor]?.p ?? themesDoc.byWord[w?.formOf??w?.ex?.['0']??'']?.p
    if(direct)return direct
    const loc=locateWord(book,directoryAnchor)
    return loc ? book.groups[loc[0]].targets.map(x=>themesDoc.byWord[x]?.p).find(Boolean) : undefined
  },[directoryAnchor,book,themesDoc])
  const visibleThemes=useMemo(()=>{
    const q=libraryQuery.trim().toLowerCase()
    return (themesDoc?.themes??[]).map(th=>{
      const members=th.id===anchorTopic && directoryAnchor && !th.members.includes(directoryAnchor) ? [...th.members,directoryAnchor] : th.members
      return {...th,members:prioritySort(members.filter(w=>(frequencyMatches(w)||w===directoryAnchor) && (!q || th.name.includes(q) || w.toLowerCase().includes(q) || (book?.words[w]?.zh??'').includes(q))))}
    }).filter(th=>th.members.length>0)
  },[themesDoc,libraryQuery,book,frequencyMatches,prioritySort,directoryAnchor,anchorTopic])
  const libraryGroups = useMemo(() => {
    const q=libraryQuery.trim().toLowerCase()
    return (book?.groups ?? []).map((g,i)=>({g,i,members:prioritySort(g.members.filter(w=>(frequencyMatches(w)||w===directoryAnchor) && (!q || w.includes(q) || book?.words[w]?.zh?.includes(q))))})).filter(x=>x.members.length>0 && (x.g.targets.length>0 || Boolean(directoryAnchor && x.g.members.includes(directoryAnchor))))
  }, [book,libraryQuery,frequencyMatches,prioritySort,directoryAnchor])
  const navigationGroups=useMemo(()=>{
    const rows=libraryMode==='themes' ? visibleThemes.flatMap(th=>th.members) : libraryGroups.flatMap(x=>x.members)
    const seen=new Set<number>();const out:{gi:number;word:string}[]=[]
    for(const word of rows){
      if(!book?.words[word]?.t || !frequencyMatches(word))continue
      const gi=wordLoc.get(word)?.[0]?.[0]
      if(gi===undefined || seen.has(gi))continue
      seen.add(gi);out.push({gi,word})
    }
    return out
  },[libraryMode,visibleThemes,libraryGroups,book,frequencyMatches,wordLoc])
  const availablePages=(group?.pages??[]).map((_,i)=>i).filter(i=>{
    const word=group ? pageCenter(group,i) : null
    return Boolean(word && book?.words[word]?.t && frequencyMatches(word))
  })
  const previousPageIndex=availablePages.filter(i=>i<pageIndex).slice(-1)[0]
  const nextPageIndex=availablePages.find(i=>i>pageIndex)
  function selectGroup(gi: number) {
    if (!book) return
    const entry=libraryGroups.find(x=>x.i===gi)
    const w=entry?.members.find(w=>book.words[w]?.t) ?? entry?.members[0]
    if(!w)return
    jumpTo(w)
  }
  const listedGroups = libraryGroups.slice(0,libraryLimit)
  const anchoredGroup=directoryAnchor ? libraryGroups.find(x=>x.g.members.includes(directoryAnchor)) : undefined
  if(anchoredGroup && !listedGroups.includes(anchoredGroup))listedGroups.unshift(anchoredGroup)
  function changeFrequency(mode:FrequencyMode){setDirectoryAnchor(null);setFrequencyMode(mode);setLibraryLimit(60);setThemeLimits({})}
  function selectLibraryWord(w:string) {jumpTo(w)}

  useEffect(()=>{
    if(!directoryAnchor || !book)return
    const loc=locateWord(book,directoryAnchor)
    if(loc)setOpenGroups(new Set([book.groups[loc[0]].id]))
    if(anchorTopic){
      setOpenThemes(new Set([anchorTopic]))
      const index=visibleThemes.find(th=>th.id===anchorTopic)?.members.indexOf(directoryAnchor)??-1
      if(index>=0)setThemeLimits(prev=>({...prev,[anchorTopic]:Math.max(prev[anchorTopic]??40,index+1)}))
    }
  },[directoryAnchor,libraryMode,book,anchorTopic,prioritySort])
  useEffect(()=>{
    if(!libraryOpen || !directoryAnchor)return
    let frame=requestAnimationFrame(()=>{
      frame=requestAnimationFrame(()=>{
        const row=directoryRows.current.get(directoryAnchor),panel=directoryScroll.current
        if(!row || !panel)return
        const r=row.getBoundingClientRect(),p=panel.getBoundingClientRect()
        panel.scrollTo({top:panel.scrollTop+r.top-p.top-panel.clientHeight/2+r.height/2,behavior:'auto'})
      })
    })
    return()=>cancelAnimationFrame(frame)
  },[directoryAnchor,libraryMode,libraryOpen,openThemes,openGroups,themeLimits,libraryLimit])

  return (
    <div className={`wt-app ${detailsOpen ? '' : 'details-hidden'}`}>
      <header className="wt-header">
        <div className="wt-brand">
          <span className="wt-logo" aria-hidden="true">w.</span>
          <div>
            <h1>单词树</h1>
            <p>{meta ? `${meta.targetCount} 目标词 · ${meta.bridgeCount} 扩展词` : '载入中…'}</p>
          </div>
        </div>

        <div className="wt-search">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setQuery('')
                setSearchError('')
                return
              }
              if (e.key === 'Enter') submitSearch()
            }}
            placeholder="搜英文词：abbreviation / accommodation…"
            aria-label="搜索单词"
          />
          <button type="button" className="wt-btn primary" onClick={submitSearch}>搜索</button>
          {query ? (
            <button type="button" className="wt-clear" aria-label="清空搜索" onClick={() => { setQuery(''); setSearchError('') }}>×</button>
          ) : null}
          {suggestions.length ? (
            <ul className="wt-suggest">
              {suggestions.map((w) => (
                <li key={w}>
                  <button
                    type="button"
                    onClick={() => {
                      jumpTo(w)
                      setLibraryOpen(true)
                      setQuery('')
                      setSearchError('')
                    }}
                  >
                    <b>{w}</b>
                    <span>{book?.words[w]?.zh?.slice(0, 18) ?? '—'}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="wt-actions"><button type="button" className="wt-btn" aria-expanded={libraryOpen} onClick={()=>setLibraryOpen(v=>!v)}>{libraryOpen?'收起目录':'词族目录'}</button>
          <button
            type="button"
            className="wt-btn focus-toggle"
            aria-pressed={!detailsOpen}
            onClick={() => setDetailsOpen((v) => !v)}
          >
            {detailsOpen ? '专注导图' : '展开详情'}
          </button>
          <button type="button" className="wt-btn" onClick={onBackToDemo}>回示范词族</button>
          <button type="button" className="wt-btn" onClick={back} disabled={!history.length}>← 返回</button>
          <button type="button" className="wt-btn" onClick={onExport}>导出进度</button>
          <label className="wt-btn file">
            导入进度
            <input
              type="file"
              accept="application/json"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImport(f)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </header>

      <section className="wt-current">
        <div className="wt-current-main">
          <div className="wt-current-word">
            <h2>{viewing ?? '—'}</h2>
            {viewingCurated?.ipa || viewingWord?.ipa ? (
              <span className="wt-ipa-lg">{viewingCurated?.ipa ?? viewingWord?.ipa}</span>
            ) : (
              <span className="wt-ipa-lg">音标暂未收录</span>
            )}
            <button type="button" className="wt-btn ghost" onClick={() => viewing && speak(viewing)} title="用系统语音朗读（英式）">
              ▷ 发音
            </button>
            <span className="wt-tag">{formatPos(viewingCurated?.pos ?? viewingWord?.pos ?? '词性待补')}</span>
            {viewingWord?.t ? <span className="wt-tag family">雅思目标词</span> : <span className="wt-tag">扩展词</span>}
            {viewing && viewing === center ? <span className="wt-tag center">当前中心</span> : null}
            {viewing && frequencyDoc?.byWord[viewing] ? <span className="wt-badge-frequency" title={'匹配 NGSL 基础高频词表'}>{'基础高频'}</span> : null}
            {viewingCurated ? <span className="wt-tag center">已核对内容</span> : null}
          </div>
          <p className="wt-current-gloss">
            {viewingCurated?.gloss ?? viewingWord?.zh ?? '释义暂未收录（ECDICT 无中文条目）'}
          </p>
          {viewingCurated?.note ? <p className="wt-current-note">{viewingCurated.note}</p> : null}
          {group?.inflectionEdges.some(e=>e.from===viewing) ? <p className="wt-current-note">变形：{group.inflectionEdges.filter(e=>e.from===viewing).map(e=>`${e.to}（${e.label??'词形变化'}）`).join('、')}</p> : null}
        </div>
        <div className="wt-current-side">
          {viewing ? (
            <>
              <button type="button" className={`wt-btn ${favorites.has(viewing) ? 'on' : ''}`} onClick={() => onToggleFav(viewing)}>
                {favorites.has(viewing) ? '★ 已收藏' : '☆ 收藏'}
              </button>
              <button type="button" className={`wt-btn ${mastered.has(viewing) ? 'on' : ''}`} onClick={() => onToggleMastered(viewing)}>
                {mastered.has(viewing) ? '✓ 已掌握' : '○ 标记已掌握'}
              </button>
              {viewing !== center ? (
                <button type="button" className="wt-btn wide" onClick={() => viewing && jumpTo(viewing)}>以「{viewing}」为中心</button>
              ) : null}
              <div className="wt-progress">收藏 {favorites.size} · 掌握 {mastered.size}</div>
            </>
          ) : null}
        </div>
      </section>

      <div className={`wt-body ${libraryOpen?'wt-has-library':''}`}>
        {libraryOpen && <nav className="wt-library" aria-label="词族与单词目录">
          <div className="wt-library-head"><b>学习目录</b><button type="button" onClick={()=>setLibraryOpen(false)} aria-label="关闭目录">×</button></div>
          <div className="wt-library-mode">
            <button type="button" className={libraryMode==='themes'?'active':''} onClick={()=>{setLibraryMode('themes');setDirectoryAnchor(viewing)}}>主题</button>
            <button type="button" className={libraryMode==='families'?'active':''} onClick={()=>{setLibraryMode('families');setDirectoryAnchor(viewing)}}>词族</button>
          </div>
          <div className="wt-frequency-filter" role="group" aria-label="背诵优先级">
            {([['all','全部'],['high','高频优先'],['other','其余词']] as const).map(([mode,label])=><button type="button" key={mode} aria-pressed={frequencyMode===mode} disabled={!frequencyDoc && mode!=='all'} onClick={()=>changeFrequency(mode)}>{label}</button>)}
          </div>
          <div className="wt-frequency-summary" aria-live="polite">{frequencyDoc ? `${frequencyMode==='high'?'高频优先':frequencyMode==='other'?'其余目标词':'全部目标词'} ${frequencyMode==='high'?frequencyDoc.counts.highTargets:frequencyMode==='other'?frequencyDoc.counts.otherTargets:frequencyDoc.counts.targets} 词` : frequencyError ? '高频词表加载失败，可刷新重试' : '正在对比高频词表…'}</div>
          <details className="wt-frequency-source"><summary>筛选依据</summary><p><a href="https://www.newgeneralservicelist.com/new-general-service-list" target="_blank" rel="noreferrer">NGSL 基础高频</a>。对照原词及词典明确记载的变形；高频列表按优先级排列。</p></details>
          <input aria-label="筛选词族目录" placeholder="筛选词族 / 单词 / 释义" value={libraryQuery} onChange={e=>{setDirectoryAnchor(null);setLibraryQuery(e.target.value);setLibraryLimit(60)}} />
          <span className="wt-library-count">{libraryMode==='themes' ? `${visibleThemes.length} 个主题 · ${visibleThemes.reduce((n,th)=>n+th.members.length,0)} 个词` : `${libraryGroups.length} 个词族`}</span>
          {directoryAnchor && (!frequencyMatches(directoryAnchor) || !book?.words[directoryAnchor]?.t) ? <div className="wt-directory-context" role="status">定位 {directoryAnchor} · {!book?.words[directoryAnchor]?.t?'关联词形':frequencyMode==='high'?'不在高频筛选中':'属于高频词'}<button type="button" onClick={()=>setDirectoryAnchor(null)}>恢复筛选</button></div> : null}
          <div className="wt-library-scroll" ref={directoryScroll}>
            {libraryMode==='themes' ? visibleThemes.map(th=>{
              const members=th.members
              const open=openThemes.has(th.id)
              return <details key={th.id} open={open}><summary onClick={ev=>{ev.preventDefault();setOpenThemes(prev=>{const n=new Set(prev);if(n.has(th.id))n.delete(th.id);else n.add(th.id);return n})}}><b>{th.name}</b><span>{members.length}</span></summary>
                <div>{members.slice(0,(themeLimits[th.id]??40)).map(w=><button type="button" key={w} ref={rowRef(w)} data-directory-word={w} className={w===viewing?'active':''} aria-current={w===viewing?'true':undefined} onClick={()=>jumpTo(w)} title={book?.words[w]?.zh}><b>{w}</b><small className="wt-zh">{(book?.words[w]?.zh||'').slice(0,14)}</small></button>)}
                  {members.length>(themeLimits[th.id]??40) ? <button type="button" className="wt-btn library-more" onClick={()=>setThemeLimits(prev=>({...prev,[th.id]:(prev[th.id]??40)+60}))}>再看 60 词（还剩 {members.length-(themeLimits[th.id]??40)}）</button> : null}
                </div>
              </details>
            }) : listedGroups.map(({g,i,members})=><details key={g.id} open={openGroups.has(g.id)} className={i===groupIndex?'active':''}>
              <summary onClick={event=>{event.preventDefault();if(i!==groupIndex) selectGroup(i);else setOpenGroups(prev=>{const next=new Set(prev);if(next.has(g.id)) next.delete(g.id);else next.add(g.id);return next})}}><b>{g.hub || baseWord(g)}</b><span>{members.length}</span></summary>
              <div>{members.map(w=><button type="button" key={w} ref={rowRef(w)} data-directory-word={w} aria-current={w===viewing?'true':undefined} className={w===viewing?'active':''} onClick={()=>selectLibraryWord(w)} title={book?.words[w]?.zh}><b>{w}</b><small>{book?.words[w]?.pos ?? ''}</small></button>)}</div>
            </details>)}
            {libraryMode==='families' && libraryGroups.length>libraryLimit && <button type="button" className="wt-btn library-more" onClick={()=>setLibraryLimit(n=>n+60)}>再显示 60 组</button>}
            {libraryMode === 'themes'
              ? (visibleThemes.length===0 && <p className="wt-muted">没有匹配的主题或单词</p>)
              : (libraryGroups.length===0 && <p className="wt-muted">没有匹配的词族</p>)}
          </div>
        </nav>}

        <main className="wt-tree">
          <div className="wt-tree-toolbar">
            <div className="wt-family-nav" aria-label="词族切换">
              <button type="button" onClick={() => goGroup(-1)} disabled={!navigationGroups.length}>← 上一组</button>
              <button type="button" onClick={() => goGroup(1)} disabled={!navigationGroups.length}>下一组 →</button>
              <button type="button" onClick={() => goPage(-1)} disabled={previousPageIndex===undefined}>上一词</button>
              <button type="button" onClick={() => goPage(1)} disabled={nextPageIndex===undefined}>下一词</button>
            </div>
            <span className="wt-group-count">
              {(() => {
                if (!group) return '—'
                if (group.kind === 'word') return `${center ?? group.hub} · 单词`
                if (group.kind === 'pending') {
                  const topic = (group.pageTitles?.[pageIndex] || '主题词组').replace(/^待整理\s*·\s*/, '').replace(/（\d+ 词）$/, '')
                  const page = group.pages[pageIndex] || []
                  const pageTargets = page.filter((w) => book?.words[w]?.t)
                  const doneHere = pageTargets.filter((w) => mastered.has(w)).length
                  return `${topic} · 主题词组 · 第 ${pageIndex + 1}/${Math.max(pageCount, 1)} 页 · 本页目标 ${pageTargets.length}（掌握 ${doneHere}）`
                }
                return `${group.hub} · 关联词组 · 第 ${pageIndex + 1}/${Math.max(pageCount, 1)} 词条视图 · 目标 ${groupTargets.length}（掌握 ${doneTargets}）`
              })()}
            </span>
            <div className="wt-legend">
              <span><i style={{ background: '#7a5cc4' }} />词语关联</span>
              <span><i style={{ background: '#0f9d58' }} />词形变化</span>
            </div>
          </div>
          <div className="wt-book-summary">
            <span>{meta ? `全书 ${meta.targetCount} 目标 · ${meta.bridgeCount} 扩展 · ${meta.groupCount} 组` : '载入中…'}</span>
            <span>本组目标 {groupTargets.length}（掌握 {doneTargets}）</span>
            <span>扩展 {group ? group.members.length - groupTargets.length : 0}</span>
          </div>
          {(() => {
            let key=viewing??''
            const traced=new Set<string>()
            while(key && !etymDoc[key] && !traced.has(key)){
              traced.add(key)
              const parent=book?.words[key]?.formOf ?? group?.inflectionEdges.find(e=>e.to===key)?.from
              if(!parent)break
              key=parent
            }
            const ety = etymDoc[key]
            const cur = book?.words[viewing ?? '']
            if (!ety) return null
            const chain = ety.chain || []
            const cleanText = ety.text && !/(Cognate with|equivalent to\s*\.|;\s*[a-z]{3,};|from\s+[，,])/i.test(ety.text)
            if (!chain.length && !cleanText) return null
            return (
              <details className="wt-history" open>
                <summary>溯源 · {key}{key!==viewing ? <small>（{viewing} 的原词）</small>:null}</summary>
                {chain.length ? (
                  <ul className="wt-history-chain">
                    {chain.map((c: any, i: number) => (
                      <li key={i}>
                        <b>{LANG_ZH[c.lang] || c.langZh || c.lang}</b> {c.word}
                        {c.display ? <em>（{c.display}）</em> : null}
                        {c.gloss ? <span className="wt-history-gloss">旧义：{c.gloss.replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g,'$1')}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {cur?.zh ? <p className="wt-history-now">今义：{cur.zh}</p> : null}
                {!chain.length && cleanText ? <p className="wt-history-text">{ety.text}</p> : null}
                <a className="wt-ex-link" href={`https://en.wiktionary.org/wiki/${encodeURIComponent(key)}#English`} target="_blank" rel="noreferrer">Wiktionary 来源</a>
              </details>
            )
          })()}
          {book && group ? (
            <IeltsView
              book={book}
              groupIndex={groupIndex}
              pageIndex={pageIndex}
              center={center}
              viewing={viewing}
              onPick={onPick}
            />
          ) : (
            <div className="wt-empty">
              <h3>{loadError || '正在载入词库…'}</h3>
              <p>正在载入词条和关联数据。</p>
            </div>
          )}
          {searchError ? (
            <div className="wt-notice" role="status" onClick={() => setSearchError('')}>
              没有找到「{searchError}」，换个英文词试试 · 点击关闭
            </div>
          ) : null}
        </main>

        <aside className="wt-side">
          <h3>释义</h3>
          <p className="wt-current-gloss">
            {viewingWord?.pos ? <span className="wt-side-pos">{viewingWord.pos}</span> : null}
            {(viewingCurated?.gloss ?? viewingWord?.zh ?? '释义暂未收录').replace(/^(n|v|vt|vi|a|adj|ad|adv|prep|pron|conj|num|art|int|aux)\.\s*/i, '')}
          </p>
          {(() => {
            const cols = (examplesDoc[viewing ?? ''] || []).flatMap((x) => x.collocations || [])
            if (!cols.length) return null
            return (
              <>
                <h3>搭配</h3>
                <ul className="wt-colloc">
                  {cols.slice(0, 4).map((c, i) => (<li key={i}><b>{c.phrase}</b><span>{c.zh}</span></li>))}
                </ul>
              </>
            )
          })()}
          {(() => {
            const page = group?.pages[pageIndex] || []
            const others = page.filter((w) => w !== viewing).slice(0, 10)
            if (!others.length) return null
            return (
              <>
                <h3>关联词速览</h3>
                <ul className="wt-mini-list">
                  {others.map((w) => (<li key={w}><button type="button" onClick={() => jumpTo(w)}>{w}</button><span>{book?.words[w]?.zh?.slice(0, 12) ?? ''}</span></li>))}
                </ul>
              </>
            )
          })()}

          {alsoIn.length ? (
            <p className="wt-muted" style={{ marginTop: 8 }}>
              也见于：{alsoIn.map((g, i) => (
                <button key={g.id} type="button" className="wt-link" onClick={() => {
                  const gi = book?.groups.findIndex((x) => x.id === g.id) ?? 0
                  const pi=book?.groups[gi]?.pages.findIndex(page=>page.includes(viewing??''))??0
                  setGroupIndex(gi);setPageIndex(Math.max(0,pi));setCenter(viewing);setDirectoryAnchor(viewing)
                }}>{baseWord(g)}{i < alsoIn.length - 1 ? '、' : ''}</button>
              ))}
            </p>
          ) : null}
          <h3>
            双语例句
            {viewingCurated ? <span className="wt-badge-self">自编</span> : null}
            {!viewingCurated && (examplesDoc[viewing ?? ''] || [])[0]?.source === 'self-authored' ? <span className="wt-badge-self">自编例句</span> : null}
            {!viewingCurated && (examplesDoc[viewing ?? ''] || [])[0]?.source === 'Tatoeba' ? <span className="wt-badge-self">Tatoeba · CC BY 2.0 FR</span> : null}
          </h3>
          {viewingCurated?.examples?.length ? (
            <ol>{viewingCurated.examples.map((ex, i) => (<li key={i}><p className="wt-ex-en">{ex.en}</p><p className="wt-ex-zh">{ex.zh}</p></li>))}</ol>
          ) : (examplesDoc[viewing ?? ''] || []).length ? (
            <ol>{(examplesDoc[viewing ?? ''] || []).slice(0, 2).map((ex, i) => (
              <li key={i}><p className="wt-ex-en">{ex.en}</p><p className="wt-ex-zh">{ex.zh}</p>
                {ex.sentenceUrl ? <a className="wt-ex-link" href={ex.sentenceUrl} target="_blank" rel="noreferrer">原句</a> : null}</li>))}</ol>
          ) : (<p className="wt-muted">这个词还没找到可靠例句。</p>)}

          {favorites.size ? <h3>已收藏</h3> : null}
          {favorites.size ? (
            <ul className="wt-mini-list">
              {[...favorites].slice(0, 10).map((w) => (
                <li key={w}>
                  <button type="button" onClick={() => jumpTo(w)}>{w}</button>
                  <span>{book?.words[w]?.zh?.slice(0, 12) ?? ''}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <details className="wt-reference" style={{marginTop: 14}}>
            <summary>来源与许可 <span>展开</span></summary>
            <p className="wt-muted">释义 ECDICT（MIT）；关联词 Open English WordNet（CC BY 4.0）及已核对关系；例句逐条标注；词史 Wiktionary（CC BY-SA）。</p>
          </details>
        </aside>
      </div>
    </div>
  )
}
