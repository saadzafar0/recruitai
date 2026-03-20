import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Mail, Phone, Calendar, FileText } from 'lucide-react';
import { candidates } from '../../data/mockData';

export default function CVViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const candidate = candidates.find(c => c.id === id) || candidates[0];
  const initials = candidate.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => navigate('/recruiter/candidates')}
        className="flex items-center gap-1.5 text-sm mb-6 transition-colors cursor-pointer"
        style={{ color: '#7E8494' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7C6AEF'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7E8494'; }}
      >
        <ArrowLeft size={15} />
        ← Back to Candidates
      </button>

      {/* CV Document */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 2px 12px rgba(124,106,239,0.08)' }}
      >
        {/* CV Header bar */}
        <div
          className="px-4 sm:px-8 py-5 flex items-center gap-3 border-b"
          style={{ backgroundColor: '#0B0D13', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <FileText size={16} style={{ color: '#E2E4EB' }} />
          <span className="text-sm font-medium" style={{ color: '#E2E4EB' }}>
            Curriculum Vitae — {candidate.name}
          </span>
        </div>

        <div className="px-4 sm:px-10 py-6 sm:py-8">
          {/* Candidate Header */}
          <div className="flex flex-col sm:flex-row items-start gap-5 mb-8 pb-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0"
              style={{ backgroundColor: '#7C6AEF' }}
            >
              {initials}
            </div>
            <div className="flex-1">
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#E2E4EB' }}>
                {candidate.name}
              </h1>
              <p className="mt-0.5" style={{ fontSize: '1rem', color: '#7C6AEF' }}>
                {candidate.role}
              </p>
              <div className="flex flex-wrap gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-sm" style={{ color: '#7E8494' }}>
                  <Mail size={13} style={{ color: '#9585F5' }} />
                  {candidate.email}
                </span>
                <span className="flex items-center gap-1.5 text-sm" style={{ color: '#7E8494' }}>
                  <Phone size={13} style={{ color: '#9585F5' }} />
                  {candidate.phone}
                </span>
                <span className="flex items-center gap-1.5 text-sm" style={{ color: '#7E8494' }}>
                  <Calendar size={13} style={{ color: '#9585F5' }} />
                  Applied: {candidate.appliedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Education */}
          <section className="mb-8">
            <h2
              className="mb-4 pb-1.5 border-b"
              style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#E2E4EB', borderColor: '#7C6AEF', borderBottomWidth: 2 }}
            >
              EDUCATION
            </h2>
            <div className="space-y-5">
              {candidate.education.map((e, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#7C6AEF' }}
                    />
                    {i < candidate.education.length - 1 && (
                      <div className="w-px flex-1 mt-1.5" style={{ backgroundColor: '#1D202A', minHeight: 20 }} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-0.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: '#1D202A', color: '#7C6AEF', fontWeight: 500 }}
                      >
                        {e.year}
                      </span>
                    </div>
                    <p className="font-semibold" style={{ color: '#E2E4EB', fontSize: '0.9375rem' }}>
                      {e.degree}
                    </p>
                    <p className="text-sm" style={{ color: '#7E8494' }}>{e.institution}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Work Experience */}
          <section className="mb-8">
            <h2
              className="mb-4 pb-1.5 border-b"
              style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#E2E4EB', borderColor: '#7C6AEF', borderBottomWidth: 2 }}
            >
              WORK EXPERIENCE
            </h2>
            <div className="space-y-6">
              {candidate.experience.map((e, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#9585F5' }}
                    />
                    {i < candidate.experience.length - 1 && (
                      <div className="w-px flex-1 mt-1.5" style={{ backgroundColor: '#1D202A', minHeight: 20 }} />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-start justify-between mb-0.5">
                      <p className="font-semibold" style={{ color: '#E2E4EB', fontSize: '0.9375rem' }}>
                        {e.title}
                      </p>
                      <span
                        className="text-xs px-2 py-0.5 rounded ml-3 flex-shrink-0"
                        style={{ backgroundColor: '#1D202A', color: '#7E8494' }}
                      >
                        {e.year}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1.5" style={{ color: '#7C6AEF' }}>{e.company}</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#7E8494' }}>{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Skills */}
          <section>
            <h2
              className="mb-4 pb-1.5 border-b"
              style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#E2E4EB', borderColor: '#7C6AEF', borderBottomWidth: 2 }}
            >
              SKILLS
            </h2>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map(skill => (
                <span
                  key={skill}
                  className="text-sm px-3 py-1.5 rounded border transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#7E8494' }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
