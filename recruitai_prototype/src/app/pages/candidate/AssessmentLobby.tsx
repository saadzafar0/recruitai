import { useNavigate } from 'react-router';
import { Mic, Code2, Layout, CheckCircle, XCircle, Globe, Camera, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCandidateContext } from '../../context/CandidateContext';

function HardwareStatus({ icon: Icon, label, ok }: { icon: any; label: string; ok: boolean }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg border"
      style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#171921' }}
    >
      <Icon size={15} style={{ color: ok ? '#3ECF8E' : '#EF6B6B' }} />
      <span className="text-sm" style={{ color: '#7E8494' }}>{label}</span>
      <span
        className="ml-auto text-xs px-2 py-0.5 rounded"
        style={{
          color: ok ? '#3ECF8E' : '#EF6B6B',
          backgroundColor: ok ? 'rgba(62,207,142,0.08)' : 'rgba(239,107,107,0.08)',
        }}
      >
        {ok ? '✓ Ready' : '✗ Not Available'}
      </span>
    </div>
  );
}

type TaskStatus = 'not_started' | 'in_progress' | 'completed';

function TaskCard({
  icon: Icon,
  title,
  duration,
  status,
  disabled,
  disabledReason,
  onBegin,
}: {
  icon: any;
  title: string;
  duration: string;
  status: TaskStatus;
  disabled?: boolean;
  disabledReason?: string;
  onBegin: () => void;
}) {
  const statusConfig = {
    not_started: { label: 'Not Started', color: '#7E8494', bg: '#1D202A' },
    in_progress: { label: 'In Progress', color: '#E5A93B', bg: 'rgba(229,169,59,0.08)' },
    completed: { label: 'Completed', color: '#3ECF8E', bg: 'rgba(62,207,142,0.08)' },
  };
  const s = statusConfig[status];

  return (
    <div
      className="rounded-lg p-6 border flex flex-col transition-colors"
      style={{
        borderColor: 'rgba(255,255,255,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        borderTop: '3px solid #7C6AEF',
        backgroundColor: '#171921',
        opacity: disabled && status !== 'completed' ? 0.6 : 1,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded flex items-center justify-center"
          style={{ backgroundColor: '#1D202A' }}
        >
          <Icon size={18} style={{ color: '#7C6AEF' }} />
        </div>
        {status === 'completed' ? (
          <CheckCircle size={18} style={{ color: '#3ECF8E' }} />
        ) : (
          <span
            className="text-xs px-2 py-1 rounded"
            style={{ color: s.color, backgroundColor: s.bg }}
          >
            {s.label}
          </span>
        )}
      </div>
      <h3 className="mb-1" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
        {title}
      </h3>
      <p className="text-sm mb-5" style={{ color: '#7E8494', opacity: 0.6 }}>Est. {duration}</p>

      {status === 'completed' ? (
        <div
          className="mt-auto flex items-center gap-2 text-sm"
          style={{ color: '#3ECF8E' }}
        >
          <CheckCircle size={14} />
          Submitted
        </div>
      ) : (
        <div className="mt-auto relative">
          <button
            onClick={onBegin}
            disabled={disabled}
            className="w-full py-2.5 text-sm text-white rounded transition-colors disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: disabled ? '#1D202A' : '#7C6AEF' }}
            title={disabled ? disabledReason : undefined}
            onMouseEnter={e => {
              if (!disabled) (e.currentTarget as HTMLElement).style.backgroundColor = '#9585F5';
            }}
            onMouseLeave={e => {
              if (!disabled) (e.currentTarget as HTMLElement).style.backgroundColor = '#7C6AEF';
            }}
          >
            Begin
          </button>
          {disabled && disabledReason && (
            <div className="mt-2 flex items-start gap-1.5 text-xs" style={{ color: '#EF6B6B' }}>
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
              {disabledReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssessmentLobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { voiceStatus, codingStatus, designStatus, micAvailable, setMicAvailable } =
    useCandidateContext();

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Welcome */}
      <div className="mb-8">
        <h1
          className="mb-1"
          style={{ fontSize: '1.5rem', fontWeight: 600, color: '#E2E4EB' }}
        >
          Welcome back, {firstName}
        </h1>
        <p className="text-sm" style={{ color: '#7E8494' }}>
          Applied for:{' '}
          <span className="font-medium" style={{ color: '#E2E4EB' }}>
            Senior Frontend Engineer
          </span>
        </p>
      </div>

      {/* Hardware check */}
      <div
        className="rounded-lg p-5 border mb-8"
        style={{ borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', backgroundColor: '#171921' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
            System Check
          </h2>
          <button
            onClick={() => setMicAvailable(v => !v)}
            className="text-xs underline cursor-pointer transition-colors"
            style={{ color: '#7E8494' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7C6AEF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7E8494'; }}
          >
            Toggle mic (demo)
          </button>
        </div>
        <div className="space-y-2">
          <HardwareStatus icon={Mic} label="Microphone" ok={micAvailable} />
          <HardwareStatus icon={Globe} label="Browser Compatibility" ok={true} />
          <HardwareStatus icon={Camera} label="Camera" ok={true} />
        </div>
      </div>

      {/* Task cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <TaskCard
          icon={Mic}
          title="Voice Interview"
          duration="20 minutes"
          status={voiceStatus}
          disabled={!micAvailable}
          disabledReason="Microphone access required."
          onBegin={() => navigate('/candidate/voice-interview')}
        />
        <TaskCard
          icon={Code2}
          title="Coding Test"
          duration="45 minutes"
          status={codingStatus}
          onBegin={() => navigate('/candidate/coding-test')}
        />
        <TaskCard
          icon={Layout}
          title="System Design"
          duration="30 minutes"
          status={designStatus}
          onBegin={() => navigate('/candidate/system-design')}
        />
      </div>

      {/* Timeline note */}
      <div
        className="flex items-start gap-3 px-4 py-3.5 rounded-lg border text-sm"
        style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#171921', color: '#7E8494' }}
      >
        <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#7C6AEF' }} />
        Your results will be reviewed by the recruiter within 48 hours. You'll receive an email
        notification once a decision has been made.
      </div>
    </div>
  );
}
