import { useNavigate } from 'react-router';
import { CheckCircle } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'AI evaluates your responses',
    description:
      'Our AI analyzes your voice interview, coding submission, and system design for quality and relevance.',
  },
  {
    number: 2,
    title: 'Recruiter reviews your ranking',
    description:
      'Your results are scored and ranked against other candidates. A recruiter will review your profile.',
  },
  {
    number: 3,
    title: "You'll hear back within 48 hours",
    description:
      'Expect an email update regarding the next steps. Check your spam folder if you don\'t see it.',
  },
];

export default function Confirmation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16" style={{ backgroundColor: '#1D202A' }}>
      <div className="max-w-lg w-full text-center">
        {/* Checkmark */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(62,207,142,0.08)' }}
          >
            <CheckCircle size={44} style={{ color: '#3ECF8E' }} />
          </div>
        </div>

        {/* Heading */}
        <h1
          className="mb-2"
          style={{ fontSize: '1.5rem', fontWeight: 600, color: '#E2E4EB' }}
        >
          All done! Your assessment has been submitted.
        </h1>
        <p className="text-sm mb-10" style={{ color: '#7E8494' }}>
          Here's what happens next.
        </p>

        {/* Steps timeline */}
        <div
          className="rounded-lg p-6 border text-left mb-8"
          style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
        >
          {steps.map((step, i) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: '#7C6AEF' }}
                >
                  {step.number}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="w-px flex-1 my-2"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', minHeight: 32 }}
                  />
                )}
              </div>
              <div className="pb-6">
                <p className="font-medium mb-1" style={{ color: '#E2E4EB', fontSize: '0.9375rem' }}>
                  {step.title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#7E8494' }}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
        >
          {[
            { label: 'Voice Interview', status: 'Submitted' },
            { label: 'Coding Test', status: 'Submitted' },
            { label: 'System Design', status: 'Submitted' },
          ].map(({ label, status }) => (
            <div
              key={label}
              className="rounded-lg p-3 border text-center"
              style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <CheckCircle size={16} className="mx-auto mb-1.5" style={{ color: '#3ECF8E' }} />
              <p className="text-xs font-medium" style={{ color: '#E2E4EB' }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: '#3ECF8E' }}>{status}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/candidate')}
          className="px-6 py-2.5 text-sm rounded border transition-colors cursor-pointer"
          style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#7E8494', backgroundColor: '#171921' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1D202A'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#171921'; }}
        >
          Return to Assessment Lobby
        </button>
      </div>
    </div>
  );
}
