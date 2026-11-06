import { EdgeLabelRenderer, type EdgeProps } from '@xyflow/react'
import { EDGE_COLOR, type EdgeKind } from '../graph'

export interface MapEdgeData {
  kind: EdgeKind
  label?: string
  hint?: string
  verified?: boolean
  lane?: number
  bend?: number
}

/** 三次贝塞尔上取点 */
function bezierAt(t: number, sx: number, sy: number, c1x: number, c1y: number, c2x: number, c2y: number, tx: number, ty: number) {
  const mt = 1 - t
  const x = mt * mt * mt * sx + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * tx
  const y = mt * mt * mt * sy + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * ty
  return { x, y }
}

/**
 * 思维导图风格的曲线边：
 * - 派生/变形：箭头落在子节点（父 → 子）
 * - 词源：箭头指回左侧词根（用户读作「单词 源自 词根」），所以箭头画在 source 端
 * - 标签用独立 HTML 浮层，贴在曲线上方 18px，按 lane 错开，不压线
 */
export default function MapEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY } = props
  const data = (props.data ?? {}) as unknown as MapEdgeData
  const kind: EdgeKind = data.kind ?? 'derivation'
  const color = EDGE_COLOR[kind]
  const lane = data.lane ?? 0

  const gap = Math.max(48, Math.abs(targetX - sourceX) * 0.5)
  const direction = targetX >= sourceX ? 1 : -1
  const c1x = sourceX + gap * direction
  const c1y = sourceY + (data.bend ?? 0)
  const c2x = targetX - gap * direction
  const c2y = targetY + (data.bend ?? 0)
  const path = `M ${sourceX},${sourceY} C ${c1x},${c1y} ${c2x},${c2y} ${targetX},${targetY}`

  const labelPoint = bezierAt(0.5, sourceX, sourceY, c1x, c1y, c2x, c2y, targetX, targetY)
  const laneOffset = ((lane % 3) - 1) * 16

  // 词语关联（如 WordNet 词汇关系）是无向关系：不画箭头，用点划线区分
  const dash = kind === 'inflection' ? '6 5' : kind === 'association' ? '2 5' : undefined

  return (
    <>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={kind === 'inflection' ? 1.8 : kind === 'association' ? 1.6 : 2.4}
        strokeDasharray={dash}
        strokeLinecap="round"
      />
      {kind === 'association' ? null : kind === 'etymology' ? (
        // 箭头指回来源（左端）
        <polygon points={`${sourceX},${sourceY} ${sourceX + 9 * direction},${sourceY - 5} ${sourceX + 9 * direction},${sourceY + 5}`} fill={color} />
      ) : (
        <polygon points={`${targetX},${targetY} ${targetX - 9 * direction},${targetY - 5} ${targetX - 9 * direction},${targetY + 5}`} fill={color} />
      )}
      {data.label ? (
        <EdgeLabelRenderer>
          <div
            className={`wt-edge-label ${kind}`}
            title={data.hint || data.label}
            style={{
              transform: `translate(-50%, -100%) translate(${labelPoint.x}px, ${labelPoint.y - 16 + laneOffset}px)`,
              borderColor: color,
              color,
            }}
          >
            {data.label}
            {data.verified ? <span className="wt-edge-check" title="已有来源依据">✓</span> : null}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}
