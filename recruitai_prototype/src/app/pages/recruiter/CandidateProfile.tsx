import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Mail, Phone, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import { candidates } from '../../data/mockData';

function getScoreColor(score: number) {
  if (score >= 80) return '#3ECF8E';
  if (score >= 65) return '#E5A93B';
  return '#EF6B6B';
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm" style={{ color: '#7E8494' }}>{label}</span>
        <span className="text-sm font-semibold" style={{ color: getScoreColor(value) }}>
          {value}/100
        </span>
      </div>
      <div className="h-2 rounded-full" style={{ backgroundColor: '#1D202A' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: '#9585F5' }}
        />
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  score,
  summary,
}: {
  title: string;
  score: number;
  summary: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 transition-colors cursor-pointer"
        style={{ backgroundColor: '#171921' }}
        onClick={() => setOpen(o => !o)}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#171921'; }}
      >
        <span className="text-sm font-medium" style={{ color: '#E2E4EB' }}>
          {title}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: getScoreColor(score) }}>
            {score}/100
          </span>
          {open ? <ChevronUp size={14} style={{ color: '#7E8494' }} /> : <ChevronDown size={14} style={{ color: '#7E8494' }} />}
        </div>
      </button>
      {open && (
        <div className="px-5 py-4 border-t" style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#7E8494' }}>{summary}</p>
        </div>
      )}
    </div>
  );
}

// Confirmation Modal
function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div
        className="rounded-xl shadow-xl w-full max-w-md p-6 relative"
        style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
        <h3 className="mb-2" style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#E2E4EB' }}>
          {title}
        </h3>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: '#7E8494' }}>
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2 text-sm rounded border transition-colors cursor-pointer"
            style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#7E8494' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1D202A'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-sm text-white rounded transition-colors cursor-pointer"
            style={{ backgroundColor: confirmColor }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const candidate = candidates.find(c => c.id === id) || candidates[0];
  const initials = candidate.name.split(' ').map(n => n[0]).join('');

  const [candidateStatus, setCandidateStatus] = useState(candidate.status);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleAdvanceConfirm = () => {
    setCandidateStatus('hired');
    setShowAdvanceModal(false);
  };

  const handleRejectConfirm = () => {
    setCandidateStatus('rejected');
    setShowRejectModal(false);
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    shortlisted: { label: 'Shortlisted', color: '#7C6AEF', bg: '#1D202A' },
    under_review: { label: 'Under Review', color: '#E5A93B', bg: 'rgba(229,169,59,0.08)' },
    rejected: { label: 'Rejected', color: '#EF6B6B', bg: 'rgba(239,107,107,0.08)' },
    hired: { label: 'Advanced', color: '#3ECF8E', bg: 'rgba(62,207,142,0.08)' },
  };

  const currentStatus = statusConfig[candidateStatus] || statusConfig.under_review;

  return (
    <>
      {/* Advance Modal */}
      <ConfirmModal
        open={showAdvanceModal}
        title={`Move ${candidate.name} to the next round?`}
        message={`You are about to advance ${candidate.name} to the next stage of the recruitment process. Their status will be updated to "Advanced".`}
        confirmLabel="Confirm"
        confirmColor="#7C6AEF"
        onConfirm={handleAdvanceConfirm}
        onCancel={() => setShowAdvanceModal(false)}
      />

      {/* Reject Modal */}
      <ConfirmModal
        open={showRejectModal}
        title={`Reject ${candidate.name}?`}
        message={`Are you sure you want to reject ${candidate.name}? This action cannot be undone. Their status will be updated to "Rejected".`}
        confirmLabel="Yes, Reject"
        confirmColor="#EF6B6B"
        onConfirm={handleRejectConfirm}
        onCancel={() => setShowRejectModal(false)}
      />

      <div className="p-4 sm:p-6 max-w-6xl">
        {/* Back button */}
        <button
          onClick={() => navigate('/recruiter/candidates')}
          className="flex items-center gap-1.5 text-sm mb-5 transition-colors cursor-pointer"
          style={{ color: '#7E8494' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7C6AEF'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7E8494'; }}
        >
          <ArrowLeft size={15} />
          Back to Leaderboard
        </button>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left column – 35% */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            {/* Identity card */}
            <div
              className="rounded-lg p-6 border"
              style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              <div className="flex flex-col items-center mb-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold mb-3"
                  style={{ backgroundColor: '#7C6AEF' }}
                >
                  {initials}
                </div>
                <h2
                  className="text-center"
                  style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#E2E4EB' }}
                >
                  {candidate.name}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: '#7E8494' }}>{candidate.role}</p>
                {/* Status badge */}
                <span
                  className="mt-2 text-xs px-2.5 py-1 rounded"
                  style={{ color: currentStatus.color, backgroundColor: currentStatus.bg }}
                >
                  {currentStatus.label}
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm" style={{ color: '#7E8494' }}>
                  <Mail size={13} style={{ color: '#7E8494', opacity: 0.6 }} className="flex-shrink-0" />
                  {candidate.email}
                </div>
                <div className="flex items-center gap-2.5 text-sm" style={{ color: '#7E8494' }}>
                  <Phone size={13} style={{ color: '#7E8494', opacity: 0.6 }} className="flex-shrink-0" />
                  {candidate.phone}
                </div>
                <div className="flex items-center gap-2.5 text-sm" style={{ color: '#7E8494' }}>
                  <Calendar size={13} style={{ color: '#7E8494', opacity: 0.6 }} className="flex-shrink-0" />
                  Applied {candidate.appliedDate}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div
              className="rounded-lg p-5 border"
              style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              <h3 className="mb-3" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E2E4EB' }}>
                Skills from CV
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map(skill => (
                  <span
                    key={skill}
                    className="text-xs px-2.5 py-1 rounded border"
                    style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#7E8494' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Education */}
            <div
              className="rounded-lg p-5 border"
              style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              <h3 className="mb-3" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E2E4EB' }}>
                Education
              </h3>
              <div className="space-y-3">
                {candidate.education.map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: '#7C6AEF' }}
                      />
                      {i < candidate.education.length - 1 && (
                        <div className="w-px flex-1 mt-1" style={{ backgroundColor: '#1D202A' }} />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs" style={{ color: '#7E8494', opacity: 0.6 }}>{e.year}</p>
                      <p className="text-sm font-medium" style={{ color: '#E2E4EB' }}>
                        {e.degree}
                      </p>
                      <p className="text-sm" style={{ color: '#7E8494' }}>{e.institution}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div
              className="rounded-lg p-5 border"
              style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              <h3 className="mb-3" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E2E4EB' }}>
                Experience
              </h3>
              <div className="space-y-4">
                {candidate.experience.map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: '#7C6AEF' }}
                      />
                      {i < candidate.experience.length - 1 && (
                        <div className="w-px flex-1 mt-1" style={{ backgroundColor: '#1D202A' }} />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs" style={{ color: '#7E8494', opacity: 0.6 }}>{e.year}</p>
                      <p className="text-sm font-medium" style={{ color: '#E2E4EB' }}>
                        {e.title}
                      </p>
                      <p className="text-sm mb-1" style={{ color: '#7E8494' }}>{e.company}</p>
                      <p className="text-xs leading-relaxed" style={{ color: '#7E8494', opacity: 0.75 }}>{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column – 65% */}
          <div className="flex-1 space-y-4">
            {/* Score summary */}
            <div
              className="rounded-lg p-6 border"
              style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              <h3 className="mb-5" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
                Assessment Scores
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {[
                  { label: 'CV Match', score: candidate.cvScore },
                  { label: 'Coding', score: candidate.codingScore },
                  { label: 'Communication', score: candidate.communicationScore },
                  { label: 'Overall', score: candidate.overallScore },
                ].map(({ label, score }) => (
                  <div
                    key={label}
                    className="border rounded-lg p-4 text-center"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <p
                      className="mb-1"
                      style={{ fontSize: '1.625rem', fontWeight: 600, color: getScoreColor(score) }}
                    >
                      {score}
                    </p>
                    <p className="text-xs" style={{ color: '#7E8494' }}>{label}</p>
                  </div>
                ))}
              </div>
              <ScoreBar label="CV Match Score" value={candidate.cvScore} />
              <ScoreBar label="Coding Assessment" value={candidate.codingScore} />
              <ScoreBar label="Communication Score" value={candidate.communicationScore} />
            </div>

            {/* Collapsible sections */}
            <CollapsibleSection
              title="Interview Summary"
              score={candidate.communicationScore}
              summary={`${candidate.name} demonstrated strong communication skills throughout the interview, with clear articulation of technical concepts. Scored particularly well on questions related to their experience at previous companies. Minor hesitation noted on conflict resolution scenarios, but overall performance reflects confident and structured communication. AI recommends advancing to next round.`}
            />
            <CollapsibleSection
              title="Coding Assessment Summary"
              score={candidate.codingScore}
              summary={`Candidate solved the Two Sum problem with an optimal O(n) hash map solution. Code was clean and well-commented. The system design question showed a solid grasp of scalability principles, including horizontal scaling and caching layers. Minor deductions for missing edge case handling on empty input. Overall performance is ${candidate.codingScore >= 80 ? 'strong' : 'adequate'} for the ${candidate.role} position.`}
            />
            <CollapsibleSection
              title="System Design Summary"
              score={Math.round((candidate.codingScore + candidate.communicationScore) / 2)}
              summary={`The system design response covered the core architectural requirements well, including a proper separation of read and write paths and appropriate use of caching. The candidate demonstrated understanding of scalability trade-offs and mentioned distributed ID generation for sharding. Architecture clarity was the strongest dimension; scalability depth could be improved with more discussion on failure scenarios and data partitioning strategies.`}
            />

            {/* Action buttons */}
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => navigate(`/recruiter/candidates/${candidate.id}/interview`)}
                className="px-5 py-2.5 text-sm text-white rounded transition-colors cursor-pointer"
                style={{ backgroundColor: '#7C6AEF' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#9585F5'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7C6AEF'; }}
              >
                View Interview
              </button>
              <button
                onClick={() => navigate(`/recruiter/candidates/${candidate.id}/assessment`)}
                className="px-5 py-2.5 text-sm rounded border transition-colors cursor-pointer"
                style={{ borderColor: '#7C6AEF', color: '#7C6AEF' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1D202A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                View Assessment
              </button>
              <button
                onClick={() => navigate(`/recruiter/candidates/${candidate.id}/system-design`)}
                className="px-5 py-2.5 text-sm rounded border transition-colors cursor-pointer"
                style={{ borderColor: '#7C6AEF', color: '#7C6AEF' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1D202A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                System Design
              </button>
              <button
                onClick={() => navigate(`/recruiter/candidates/${candidate.id}/cv`)}
                className="px-5 py-2.5 text-sm rounded border transition-colors cursor-pointer"
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
              <div className="flex-1" />
              {candidateStatus !== 'hired' && candidateStatus !== 'rejected' && (
                <>
                  <button
                    onClick={() => setShowAdvanceModal(true)}
                    className="px-5 py-2.5 text-sm text-white rounded transition-colors cursor-pointer"
                    style={{ backgroundColor: '#3ECF8E' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                  >
                    Proceed to Next Round
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-5 py-2.5 text-sm rounded border transition-colors cursor-pointer"
                    style={{ borderColor: '#EF6B6B', color: '#EF6B6B' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,107,107,0.08)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                  >
                    Reject
                  </button>
                </>
              )}
              {candidateStatus === 'hired' && (
                <span
                  className="px-4 py-2.5 text-sm rounded"
                  style={{ backgroundColor: 'rgba(62,207,142,0.08)', color: '#3ECF8E' }}
                >
                  ✓ Advanced to Next Round
                </span>
              )}
              {candidateStatus === 'rejected' && (
                <span
                  className="px-4 py-2.5 text-sm rounded"
                  style={{ backgroundColor: 'rgba(239,107,107,0.08)', color: '#EF6B6B' }}
                >
                  ✗ Rejected
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
