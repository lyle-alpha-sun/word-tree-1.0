import { formatPos } from '../pos'
import { Handle, Position, type NodeProps } from '@xyflow/react'

export interface WordNodeData {
  word: string
  pos: string
  gloss: string
  ipa: string
  isRoot: boolean
  isCenter: boolean
  isSelected: boolean
  hasChildren: boolean
  expanded: boolean
  childCount: number
  isBridge?: boolean
  isHub?: boolean
  badge?: string
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onCenter: (id: string) => void
}

export default function WordNode({ id, data }: NodeProps) {
  const d = data as unknown as WordNodeData
  const className = [
    'wt-node',
    d.isCenter ? 'is-center' : '',
    d.isSelected && !d.isCenter ? 'is-selected' : '',
    d.isRoot ? 'is-root' : '',
    d.isBridge ? 'is-bridge' : '',
    d.isHub ? 'is-hub' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} data-word={d.word} title={d.gloss}
      role="button" tabIndex={0} aria-label={`查看 ${d.word}`}
      onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (event.shiftKey) d.onCenter(id); else d.onSelect(id) } }}>

      <Handle id="in-left" type="target" position={Position.Left} className="wt-handle" /><Handle id="in-right" type="target" position={Position.Right} className="wt-handle" />
      <div className="wt-node-top">
        <span className="wt-node-word">{d.word}</span>
        {d.isCenter ? <span className="wt-badge-center">中心</span> : null}
        {d.badge ? <span className="wt-badge-kind">{d.badge}</span> : null}
        {d.hasChildren ? (
          <button
            type="button"
            className="wt-node-toggle nodrag nopan"
            onClick={(event) => {
              event.stopPropagation()
              d.onToggle(id)
            }}
            title={d.expanded ? '收起这一支' : `展开 ${d.childCount} 个派生/变形`}
          >
            {d.expanded ? '−' : '+'}
          </button>
        ) : null}
      </div>
      <div className="wt-node-meta">
        {d.ipa ? <span className="wt-ipa">{d.ipa}</span> : null}
        <span className="wt-pos">{formatPos(d.pos)}</span>
      </div>
      <div className="wt-node-gloss">{d.gloss}</div>
      <Handle id="out-right" type="source" position={Position.Right} className="wt-handle" /><Handle id="out-left" type="source" position={Position.Left} className="wt-handle" />
    </div>
  )
}
