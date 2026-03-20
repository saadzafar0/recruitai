import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { candidates } from '../../data/mockData';

function getScoreColor(score: number) {
  if (score >= 80) return '#3ECF8E';
  if (score >= 65) return '#E5A93B';
  return '#EF6B6B';
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  shortlisted: { label: 'Shortlisted', color: '#7C6AEF', bg: '#1D202A' },
  under_review: { label: 'Under Review', color: '#E5A93B', bg: 'rgba(229,169,59,0.08)' },
  rejected: { label: 'Rejected', color: '#EF6B6B', bg: 'rgba(239,107,107,0.08)' },
  hired: { label: 'Hired', color: '#3ECF8E', bg: 'rgba(62,207,142,0.08)' },
};

const roles = ['All Roles', 'Senior Frontend Engineer', 'Backend Engineer', 'Full Stack Developer', 'DevOps Engineer'];
const rounds = ['All Rounds', 'Coding', 'Voice', 'All'];

export default function Candidates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [roundFilter, setRoundFilter] = useState('All Rounds');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = candidates
    .filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'All Roles' || c.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) =>
      sortDir === 'desc' ? b.overallScore - a.overallScore : a.overallScore - b.overallScore
    );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.375rem', fontWeight: 600, color: '#E2E4EB' }}>
          Candidate Ranking Leaderboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#7E8494' }}>{filtered.length} candidates across all roles</p>
      </div>

      {/* Filter bar */}
      <div
        className="rounded-lg p-4 border mb-4 flex items-center gap-3 flex-wrap"
        style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#7E8494' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search candidate name…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded border outline-none"
            style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#E2E4EB', backgroundColor: '#1D202A' }}
            onFocus={e => { e.target.style.borderColor = '#7C6AEF'; e.target.style.backgroundColor = '#171921'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.backgroundColor = '#1D202A'; }}
          />
        </div>

        {/* Role filter */}
        <div className="relative w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="appearance-none w-full sm:w-auto pl-3 pr-7 py-2 text-sm rounded border outline-none cursor-pointer"
            style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#E2E4EB', backgroundColor: '#1D202A' }}
          >
            {roles.map(r => <option key={r}>{r}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#7E8494' }} />
        </div>

        {/* Round filter */}
        <div className="relative w-full sm:w-auto">
          <select
            value={roundFilter}
            onChange={e => setRoundFilter(e.target.value)}
            className="appearance-none w-full sm:w-auto pl-3 pr-7 py-2 text-sm rounded border outline-none cursor-pointer"
            style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#E2E4EB', backgroundColor: '#1D202A' }}
          >
            {rounds.map(r => <option key={r}>{r}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#7E8494' }} />
        </div>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {filtered.map((c, i) => {
          const status = statusConfig[c.status];
          return (
            <div
              key={c.id}
              className="rounded-lg p-4 border"
              style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold" style={{ color: '#7E8494' }}>#{i + 1}</span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: '#7C6AEF' }}
                >
                  {c.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#E2E4EB' }}>{c.name}</p>
                  <p className="text-xs truncate" style={{ color: '#7E8494' }}>{c.role}</p>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded flex-shrink-0"
                  style={{ color: status.color, backgroundColor: status.bg }}
                >
                  {status.label}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: 'CV', score: c.cvScore },
                  { label: 'Code', score: c.codingScore },
                  { label: 'Comm', score: c.communicationScore },
                  { label: 'Overall', score: c.overallScore },
                ].map(({ label, score }) => (
                  <div key={label} className="text-center p-2 rounded" style={{ backgroundColor: '#1D202A' }}>
                    <p className="text-xs" style={{ color: '#7E8494' }}>{label}</p>
                    <p className="text-sm font-semibold" style={{ color: getScoreColor(score) }}>{score}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/recruiter/candidates/${c.id}`)}
                  className="flex-1 text-xs py-2 rounded border transition-colors cursor-pointer text-center"
                  style={{ borderColor: '#7C6AEF', color: '#7C6AEF' }}
                >
                  View Profile
                </button>
                <button
                  onClick={() => navigate(`/recruiter/candidates/${c.id}/cv`)}
                  className="flex-1 text-xs py-2 rounded border transition-colors cursor-pointer text-center"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#7E8494', backgroundColor: '#1D202A' }}
                >
                  View CV
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div
        className="rounded-lg border overflow-hidden hidden md:block"
        style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: '#1D202A' }}>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#7E8494' }}>
                Rank
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#7E8494' }}>
                Candidate
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#7E8494' }}>
                Applied Role
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#7E8494' }}>
                CV Score
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#7E8494' }}>
                Coding
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#7E8494' }}>
                Communication
              </th>
              <th
                className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none"
                style={{ color: '#7E8494' }}
                onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
              >
                <span className="flex items-center gap-1">
                  Overall
                  {sortDir === 'desc' ? <ChevronDown size={12} /> : sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronsUpDown size={12} />}
                </span>
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#7E8494' }}>
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#7E8494' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const status = statusConfig[c.status];
              return (
                <tr
                  key={c.id}
                  className="border-t transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold" style={{ color: '#7E8494' }}>
                      #{i + 1}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: '#7C6AEF' }}
                      >
                        {c.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium" style={{ color: '#E2E4EB' }}>
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: '#7E8494' }}>{c.role}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold" style={{ color: getScoreColor(c.cvScore) }}>
                      {c.cvScore}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold" style={{ color: getScoreColor(c.codingScore) }}>
                      {c.codingScore}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold" style={{ color: getScoreColor(c.communicationScore) }}>
                      {c.communicationScore}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold" style={{ color: getScoreColor(c.overallScore) }}>
                      {c.overallScore}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: status.color, backgroundColor: status.bg }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/recruiter/candidates/${c.id}`)}
                        className="text-xs px-3 py-1.5 rounded border transition-colors cursor-pointer"
                        style={{ borderColor: '#7C6AEF', color: '#7C6AEF' }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#1D202A';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => navigate(`/recruiter/candidates/${c.id}/cv`)}
                        className="text-xs px-3 py-1.5 rounded border transition-colors cursor-pointer"
                        style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#7E8494', backgroundColor: '#1D202A' }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = '#9585F5';
                          (e.currentTarget as HTMLElement).style.color = '#7C6AEF';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                          (e.currentTarget as HTMLElement).style.color = '#7E8494';
                        }}
                      >
                        View CV
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
