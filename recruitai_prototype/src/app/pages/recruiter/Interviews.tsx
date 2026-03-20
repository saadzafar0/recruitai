import { useNavigate } from 'react-router';
import { Mic, Calendar } from 'lucide-react';
import { candidates } from '../../data/mockData';

function getScoreColor(score: number) {
  if (score >= 80) return '#3ECF8E';
  if (score >= 65) return '#E5A93B';
  return '#EF6B6B';
}

const interviewedCandidates = candidates.filter(
  c => c.stage === 'Interview Done' || c.stage === 'Ranked'
);

export default function Interviews() {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.375rem', fontWeight: 600, color: '#E2E4EB' }}>Interviews</h1>
        <p className="text-sm mt-0.5" style={{ color: '#7E8494' }}>
          {interviewedCandidates.length} completed voice interviews
        </p>
      </div>

      <div className="space-y-3">
        {interviewedCandidates.map(c => (
          <div
            key={c.id}
            className="rounded-lg p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 transition-all cursor-pointer"
            style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            onClick={() => navigate(`/recruiter/candidates/${c.id}/interview`)}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#9585F5';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(124,106,239,0.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                style={{ backgroundColor: '#7C6AEF' }}
              >
                {c.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: '#E2E4EB' }}>{c.name}</p>
                <p className="text-sm" style={{ color: '#7E8494' }}>{c.role}</p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 flex-wrap">
              <div className="flex items-center gap-2 text-xs" style={{ color: '#7E8494' }}>
                <Calendar size={12} />
                {c.appliedDate}
              </div>
              <div className="flex items-center gap-1.5">
                <Mic size={13} style={{ color: '#7C6AEF' }} />
                <span className="text-sm font-semibold" style={{ color: getScoreColor(c.communicationScore) }}>
                  {c.communicationScore}/100
                </span>
              </div>
              <button
                className="px-3 py-1.5 text-xs border rounded transition-colors cursor-pointer"
                style={{ borderColor: '#7C6AEF', color: '#7C6AEF' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1D202A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                View Analytics
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
