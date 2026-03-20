import { useNavigate } from 'react-router';
import { Briefcase, Users, Mic, Award } from 'lucide-react';
import { recentActivity } from '../../data/mockData';

function getScoreColor(score: number) {
  if (score >= 80) return '#3ECF8E';
  if (score >= 65) return '#E5A93B';
  return '#EF6B6B';
}

const kpiCards = [
  { label: 'Active Job Postings', value: '4', icon: Briefcase, change: '+1 this week' },
  { label: 'Total Applicants', value: '159', icon: Users, change: '+12 this week' },
  { label: 'Interviews Completed', value: '63', icon: Mic, change: '+8 this week' },
  { label: 'Candidates Ranked', value: '41', icon: Award, change: '+5 this week' },
];

const funnelStages = [
  { label: 'CV Received', count: 159, pct: 100 },
  { label: 'CV Parsed', count: 134, pct: 84 },
  { label: 'Interview Done', count: 63, pct: 40 },
  { label: 'Ranked', count: 41, pct: 26 },
];

const funnelColors = ['#7C6AEF', '#9585F5', '#6366A0', '#8485B0'];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.375rem', fontWeight: 600, color: '#E2E4EB' }}>
          Recruitment Overview
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#7E8494' }}>
          Here's what's happening with your hiring pipeline.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {kpiCards.map(({ label, value, icon: Icon, change }) => (
          <div
            key={label}
            className="rounded-lg p-5 border transition-colors"
            style={{
              backgroundColor: '#171921',
              borderColor: 'rgba(255,255,255,0.06)',
              borderTop: '3px solid #7C6AEF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs mb-1" style={{ color: '#7E8494' }}>{label}</p>
                <p className="text-2xl sm:text-3xl" style={{ fontWeight: 600, color: '#E2E4EB', lineHeight: 1 }}>
                  {value}
                </p>
              </div>
              <div
                className="w-9 h-9 rounded flex items-center justify-center"
                style={{ backgroundColor: '#1D202A' }}
              >
                <Icon size={16} style={{ color: '#7C6AEF' }} />
              </div>
            </div>
            <p className="text-xs" style={{ color: '#3ECF8E' }}>
              {change}
            </p>
          </div>
        ))}
      </div>

      {/* Recruitment Funnel */}
      <div
        className="rounded-lg p-6 border mb-6"
        style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
      >
        <h2 className="mb-5" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
          Recruitment Funnel
        </h2>
        <div className="space-y-3">
          {funnelStages.map((stage, i) => (
            <div key={stage.label} className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm w-24 sm:w-36 flex-shrink-0" style={{ color: '#7E8494' }}>{stage.label}</span>
              <div className="flex-1 h-7 rounded relative" style={{ backgroundColor: '#1D202A' }}>
                <div
                  className="h-full rounded flex items-center px-3"
                  style={{
                    width: `${stage.pct}%`,
                    backgroundColor: funnelColors[i],
                  }}
                >
                  <span className="text-white text-xs font-medium">{stage.count}</span>
                </div>
              </div>
              <span className="text-sm w-10 text-right" style={{ color: '#7E8494', opacity: 0.6 }}>{stage.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-lg border"
        style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
            Recent Activity
          </h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr style={{ backgroundColor: '#1D202A' }}>
              {['Candidate', 'Job Role', 'Stage', 'Score', 'Date'].map(h => (
                <th
                  key={h}
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: '#7E8494' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentActivity.map((row, i) => (
              <tr
                key={i}
                className="border-t transition-colors cursor-pointer"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                onClick={() => navigate(`/recruiter/candidates`)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
              >
                <td className="px-4 sm:px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: '#7C6AEF' }}
                    >
                      {row.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#E2E4EB' }}>
                      {row.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3.5 text-sm" style={{ color: '#7E8494' }}>{row.role}</td>
                <td className="px-4 sm:px-6 py-3.5">
                  <span
                    className="text-xs px-2 py-1 rounded border"
                    style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#7E8494' }}
                  >
                    {row.stage}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-3.5">
                  <span className="text-sm font-semibold" style={{ color: getScoreColor(row.score) }}>
                    {row.score}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-3.5 text-sm" style={{ color: '#7E8494', opacity: 0.6 }}>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
