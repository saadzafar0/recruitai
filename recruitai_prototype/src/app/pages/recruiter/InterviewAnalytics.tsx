import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { candidates, interviewTranscript } from '../../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const clarityData = [
  { q: 'Q1', score: 82 }, { q: 'Q2', score: 91 }, { q: 'Q3', score: 76 },
  { q: 'Q4', score: 88 }, { q: 'Q5', score: 73 }, { q: 'Q6', score: 94 }, { q: 'Q7', score: 89 },
];

const relevanceData = [
  { q: 'Q1', score: 88 }, { q: 'Q2', score: 85 }, { q: 'Q3', score: 79 },
  { q: 'Q4', score: 92 }, { q: 'Q5', score: 70 }, { q: 'Q6', score: 87 }, { q: 'Q7', score: 91 },
];

const confidenceData = [
  { q: 'Q1', score: 78 }, { q: 'Q2', score: 88 }, { q: 'Q3', score: 81 },
  { q: 'Q4', score: 84 }, { q: 'Q5', score: 65 }, { q: 'Q6', score: 90 }, { q: 'Q7', score: 86 },
];

function MiniBarChart({ data, color }: { data: { q: string; score: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={90}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="q" tick={{ fontSize: 11, fill: '#7E8494' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#7E8494' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#171921', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, fontSize: 12, color: '#E2E4EB' }}
          cursor={{ fill: 'rgba(124,106,239,0.06)' }}
        />
        <Bar dataKey="score" fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function InterviewAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const candidate = candidates.find(c => c.id === id) || candidates[0];
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(37);

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      <button
        onClick={() => navigate(`/recruiter/candidates/${candidate.id}`)}
        className="flex items-center gap-1.5 text-sm mb-5 transition-colors cursor-pointer"
        style={{ color: '#7E8494' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7C6AEF'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7E8494'; }}
      >
        <ArrowLeft size={15} />
        Back to Profile
      </button>

      <div className="mb-5">
        <h1 style={{ fontSize: '1.375rem', fontWeight: 600, color: '#E2E4EB' }}>
          Interview Analytics
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#7E8494' }}>
          {candidate.name} · {candidate.role} · Completed Feb 22, 2026
        </p>
      </div>

      {/* Audio Player */}
      <div
        className="rounded-lg p-5 border mb-5"
        style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              className="transition-colors cursor-pointer"
              style={{ color: '#7E8494' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7C6AEF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7E8494'; }}
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={() => setPlaying(p => !p)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer"
              style={{ backgroundColor: '#7C6AEF' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#9585F5'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7C6AEF'; }}
            >
              {playing ? <Pause size={16} /> : <Play size={15} />}
            </button>
            <button
              className="transition-colors cursor-pointer"
              style={{ color: '#7E8494' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7C6AEF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7E8494'; }}
            >
              <SkipForward size={16} />
            </button>
          </div>

          {/* Waveform */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs w-10" style={{ color: '#7E8494' }}>08:14</span>
            <div className="flex-1 relative h-10 flex items-center">
              <div className="w-full flex items-center gap-px">
                {Array.from({ length: 80 }, (_, i) => {
                  const height = 4 + Math.abs(Math.sin(i * 0.4) * 18 + Math.sin(i * 0.7) * 10);
                  const isPlayed = i < (progress / 100) * 80;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${height}px`,
                        backgroundColor: isPlayed ? '#7C6AEF' : '#1D202A',
                      }}
                    />
                  );
                })}
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={e => setProgress(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-xs w-10 text-right" style={{ color: '#7E8494' }}>22:05</span>
          </div>
        </div>
      </div>

      {/* Transcript + Charts */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Transcript */}
        <div
          className="flex-1 rounded-lg border overflow-hidden"
          style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
              Full Transcript
            </h3>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
            {interviewTranscript.map(line => (
              <div
                key={line.id}
                className="px-5 py-3 border-b"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  borderLeft: line.quality === 'high'
                    ? '3px solid #3ECF8E'
                    : line.quality === 'medium'
                    ? '3px solid #E5A93B'
                    : '3px solid transparent',
                }}
              >
                <p
                  className="text-xs mb-1 uppercase font-medium"
                  style={{ color: line.speaker === 'AI' ? '#7C6AEF' : '#7E8494' }}
                >
                  {line.speaker}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#E2E4EB' }}>
                  {line.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Charts + Insight */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
          {/* Charts */}
          {[
            { label: 'Clarity Score by Question', data: clarityData, color: '#7C6AEF' },
            { label: 'Relevance Score by Question', data: relevanceData, color: '#E2E4EB' },
            { label: 'Confidence Score by Question', data: confidenceData, color: '#9585F5' },
          ].map(({ label, data, color }) => (
            <div
              key={label}
              className="rounded-lg p-4 border"
              style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: '#7E8494' }}>
                {label}
              </p>
              <MiniBarChart data={data} color={color} />
            </div>
          ))}

          {/* AI Insight */}
          <div
            className="rounded-lg p-4 border"
            style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', borderLeft: '3px solid #7C6AEF', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: '#7C6AEF' }}>
              AI INSIGHT SUMMARY
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#7E8494' }}>
              {candidate.name} demonstrated above-average communication clarity, scoring
              consistently high on technical explanation questions. Minor dips in confidence
              were observed on behavioral scenarios. The candidate's structured storytelling
              and use of concrete metrics reflects strong professional communication. Overall
              communication score: <strong style={{ color: '#3ECF8E' }}>{candidate.communicationScore}/100</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
