import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useCandidateContext } from '../../context/CandidateContext';

const SCENARIO = `Design a URL shortening service (similar to bit.ly) that can handle 100 million requests per day. Your design should cover the write path (shortening a URL), the read path (expanding a short URL), the data model, caching strategy, and how you would scale the system to meet traffic demand. Discuss trade-offs where applicable.`;

const PLACEHOLDER = `Start with a brief overview of your approach, then walk through:

1. Write path — how a long URL becomes a short one
2. Read path — how a short URL is resolved  
3. Data model — what you store and how
4. Caching strategy — where and what you cache
5. Scalability — how you handle 100M requests/day
6. Trade-offs — what you're sacrificing and why`;

// ─── Draggable Canvas ─────────────────────────────────────────────────────────

const INITIAL_NODES = [
  { id: '1', label: 'Client', x: 60, y: 160, color: '#7C6AEF' },
  { id: '2', label: 'Load Balancer', x: 220, y: 160, color: '#E2E4EB' },
  { id: '3', label: 'App Server', x: 400, y: 80, color: '#E2E4EB' },
  { id: '4', label: 'App Server', x: 400, y: 200, color: '#E2E4EB' },
  { id: '5', label: 'Database', x: 580, y: 130, color: '#3ECF8E' },
  { id: '6', label: 'Redis Cache', x: 580, y: 230, color: '#E5A93B' },
  { id: '7', label: 'CDN', x: 220, y: 280, color: '#9585F5' },
];

const EDGES = [
  ['1', '2'], ['2', '3'], ['2', '4'], ['3', '5'], ['4', '5'],
  ['3', '6'], ['4', '6'], ['1', '7'],
];

function DiagramCanvas() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const node = nodes.find(n => n.id === id)!;
    dragging.current = { id, ox: e.clientX - node.x, oy: e.clientY - node.y };
  };

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current) return;
      const { id, ox, oy } = dragging.current;
      setNodes(ns =>
        ns.map(n =>
          n.id === id ? { ...n, x: e.clientX - ox, y: e.clientY - oy } : n
        )
      );
    },
    []
  );

  const onMouseUp = () => {
    dragging.current = null;
  };

  const getNode = (id: string) => nodes.find(n => n.id === id)!;

  return (
    <svg
      className="w-full h-full"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ cursor: dragging.current ? 'grabbing' : 'default' }}
    >
      {/* Edges */}
      {EDGES.map(([a, b], i) => {
        const na = getNode(a);
        const nb = getNode(b);
        return (
          <line
            key={i}
            x1={na.x + 50}
            y1={na.y + 18}
            x2={nb.x + 50}
            y2={nb.y + 18}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        );
      })}
      {/* Nodes */}
      {nodes.map(node => (
        <g
          key={node.id}
          transform={`translate(${node.x}, ${node.y})`}
          style={{ cursor: 'grab' }}
          onMouseDown={e => onMouseDown(e, node.id)}
        >
          <rect
            width={100}
            height={36}
            rx={4}
            fill={node.color}
          />
          <text
            x={50}
            y={22}
            textAnchor="middle"
            fill="#fff"
            style={{ fontSize: 11, fontWeight: 500, userSelect: 'none' }}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SystemDesign() {
  const navigate = useNavigate();
  const { setDesignStatus } = useCandidateContext();
  const [tab, setTab] = useState<'written' | 'diagram'>('written');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleSubmit = () => {
    if (!text.trim() && tab === 'written') return;
    setSubmitting(true);
    setTimeout(() => {
      setDesignStatus('completed');
      navigate('/candidate/confirmation');
    }, 1800);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Scenario */}
      <div
        className="rounded-lg px-5 py-4 mb-6 border"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          borderLeft: '4px solid #7C6AEF',
          backgroundColor: '#1D202A',
        }}
      >
        <p className="text-xs font-semibold mb-1.5" style={{ color: '#7C6AEF' }}>
          SYSTEM DESIGN CHALLENGE
        </p>
        <p className="text-sm leading-relaxed" style={{ color: '#E2E4EB' }}>
          {SCENARIO}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b mb-5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {[
          { key: 'written', label: 'Written Response' },
          { key: 'diagram', label: 'Diagram' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className="px-5 py-2.5 text-sm border-b-2 -mb-px transition-colors cursor-pointer"
            style={{
              borderColor: tab === key ? '#7C6AEF' : 'transparent',
              color: tab === key ? '#7C6AEF' : '#7E8494',
              fontWeight: tab === key ? 500 : 400,
            }}
            onMouseEnter={e => {
              if (tab !== key) (e.currentTarget as HTMLElement).style.color = '#7C6AEF';
            }}
            onMouseLeave={e => {
              if (tab !== key) (e.currentTarget as HTMLElement).style.color = '#7E8494';
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'written' ? (
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            className="w-full rounded-lg p-5 text-sm border outline-none resize-none leading-relaxed"
            style={{
              borderColor: 'rgba(255,255,255,0.06)',
              color: '#E2E4EB',
              backgroundColor: '#171921',
              minHeight: 360,
            }}
            onFocus={e => { e.target.style.borderColor = '#7C6AEF'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          />
        </div>
      ) : (
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: 'rgba(255,255,255,0.06)', height: 360, backgroundColor: '#1D202A' }}
        >
          <div
            className="px-4 py-2.5 border-b text-xs"
            style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#7E8494' }}
          >
            Drag components to build your architecture diagram
          </div>
          <div style={{ height: 315, position: 'relative' }}>
            <DiagramCanvas />
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm" style={{ color: '#7E8494', opacity: 0.6 }}>
          {tab === 'written' ? `${wordCount} words` : 'Drag components to connect your architecture'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={submitting || (tab === 'written' && !text.trim())}
          className="px-6 py-2.5 text-sm text-white rounded disabled:opacity-60 cursor-pointer transition-colors"
          style={{ backgroundColor: '#7C6AEF' }}
          onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#9585F5'; }}
          onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#7C6AEF'; }}
        >
          {submitting ? 'Submitting…' : 'Submit Response'}
        </button>
      </div>
    </div>
  );
}