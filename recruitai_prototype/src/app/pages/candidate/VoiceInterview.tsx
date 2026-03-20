import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Mic, Loader2, HelpCircle, X } from 'lucide-react';
import { useCandidateContext } from '../../context/CandidateContext';

const questions = [
  'Tell me about yourself and your background in software engineering.',
  'Describe your most technically challenging project and how you solved it.',
  'How do you approach code reviews and maintaining code quality in a team?',
  'Tell me about a time you had a disagreement with a technical decision.',
  'How do you stay current with new technologies and best practices?',
  'Describe a situation where you had to meet a tight deadline.',
  'Where do you see yourself in 3 years, and how does this role fit?',
];

type State = 'idle' | 'recording' | 'processing' | 'done';

const liveResponses = [
  'I have over five years of experience building scalable web applications...',
  'The most challenging project was at Stripe, where we had to redesign our dashboard for two million merchants...',
  'I think code reviews should be collaborative and constructive. I always focus on the why behind each suggestion...',
  'There was a time we debated between REST and GraphQL — I made my case clearly and we reached a compromise...',
  'I follow key engineering blogs, attend local meetups, and I try to build a small project with any new framework...',
  'At Airbnb, we had a two-week sprint to ship a redesign. I prioritized ruthlessly and delegated effectively...',
  'I want to grow into a principal engineer role, leading architecture decisions. This position gives me that path...',
];

export default function VoiceInterview() {
  const navigate = useNavigate();
  const { setVoiceStatus } = useCandidateContext();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [state, setState] = useState<State>('idle');
  const [transcript, setTranscript] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [useTextMode, setUseTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const processingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePushToTalk = () => {
    if (state === 'idle') {
      setState('recording');
      setTranscript('');
      // Simulate live transcription
      let idx = 0;
      const response = liveResponses[questionIndex] + ' ';
      const timer = setInterval(() => {
        idx += 3;
        setTranscript(response.slice(0, idx));
        if (idx >= response.length) clearInterval(timer);
      }, 60);
    } else if (state === 'recording') {
      setState('processing');
      processingTimer.current = setTimeout(() => {
        setState('done');
      }, 1800);
    }
  };

  const handleNext = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(i => i + 1);
      setState('idle');
      setTranscript('');
      setTextInput('');
    } else {
      // Completed all questions
      setVoiceStatus('completed');
      navigate('/candidate');
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    setTranscript(textInput);
    setState('done');
  };

  useEffect(() => {
    return () => {
      if (processingTimer.current) clearTimeout(processingTimer.current);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#171921' }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 sm:px-8 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="text-sm font-medium px-3 py-1 rounded"
          style={{ backgroundColor: '#1D202A', color: '#7C6AEF' }}
        >
          Question {questionIndex + 1} of {questions.length}
        </div>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  i < questionIndex ? '#3ECF8E' : i === questionIndex ? '#7C6AEF' : '#1D202A',
              }}
            />
          ))}
        </div>
        <button
          onClick={() => setShowHelpModal(true)}
          className="flex items-center gap-1.5 text-sm transition-colors cursor-pointer"
          style={{ color: '#7E8494' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7C6AEF'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7E8494'; }}
        >
          <HelpCircle size={14} />
          Having issues?
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-8 sm:py-12">
        {/* AI Avatar */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
          style={{ backgroundColor: '#E2E4EB' }}
        >
          {state === 'recording' ? (
            <div className="flex items-end gap-0.5">
              {[12, 20, 14, 22, 10, 18, 16].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full"
                  style={{
                    height: `${h}px`,
                    backgroundColor: '#EF6B6B',
                    animation: `pulse 0.${i + 4}s ease-in-out infinite alternate`,
                  }}
                />
              ))}
            </div>
          ) : (
            <Mic size={32} style={{ color: '#9585F5' }} />
          )}
        </div>

        {/* Question card */}
        <div
          className="w-full max-w-2xl rounded-lg p-6 border mb-8"
          style={{ borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
        >
          <p className="text-xs mb-2 uppercase font-medium" style={{ color: '#7E8494', opacity: 0.6 }}>Current Question</p>
          <p style={{ fontSize: '1.0625rem', color: '#E2E4EB', lineHeight: 1.6 }}>
            {questions[questionIndex]}
          </p>
        </div>

        {/* Transcript or text input */}
        {useTextMode ? (
          <div className="w-full max-w-2xl mb-8">
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Type your response here…"
              rows={4}
              className="w-full px-4 py-3 text-sm rounded-lg border outline-none resize-none"
              style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#E2E4EB' }}
              onFocus={e => { e.target.style.borderColor = '#7C6AEF'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; }}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className="mt-2 px-4 py-2 text-sm text-white rounded disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: '#7C6AEF' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#9585F5'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7C6AEF'; }}
            >
              Submit Response
            </button>
          </div>
        ) : (
          transcript && (
            <div
              className="w-full max-w-2xl rounded-lg p-4 border mb-8 text-sm leading-relaxed"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
                backgroundColor: '#1D202A',
                color: '#E2E4EB',
                minHeight: 72,
              }}
            >
              {transcript}
              {state === 'recording' && (
                <span
                  className="inline-block w-0.5 h-4 ml-0.5 align-text-bottom"
                  style={{ backgroundColor: '#7C6AEF', animation: 'blink 1s step-end infinite' }}
                />
              )}
            </div>
          )
        )}

        {/* Push to talk button */}
        {!useTextMode && (
          <div className="flex flex-col items-center gap-4">
            {state === 'processing' ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={28} className="animate-spin" style={{ color: '#7C6AEF' }} />
                <span className="text-sm" style={{ color: '#7E8494' }}>Processing response…</span>
              </div>
            ) : state === 'done' ? (
              <button
                onClick={handleNext}
                className="px-8 py-3 text-white rounded text-sm cursor-pointer transition-colors"
                style={{ backgroundColor: '#3ECF8E' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                {questionIndex < questions.length - 1 ? 'Next Question →' : 'Complete Interview'}
              </button>
            ) : (
              <button
                onMouseDown={handlePushToTalk}
                onMouseUp={state === 'recording' ? handlePushToTalk : undefined}
                className="w-40 py-3.5 text-white rounded text-sm font-medium transition-colors cursor-pointer"
                style={{
                  backgroundColor: state === 'recording' ? '#EF6B6B' : '#E2E4EB',
                }}
              >
                {state === 'recording' ? 'Recording… Release' : '● Push to Talk'}
              </button>
            )}
            {state === 'idle' && (
              <p className="text-xs" style={{ color: '#7E8494', opacity: 0.6 }}>Hold the button while speaking, release to submit.</p>
            )}
          </div>
        )}
      </div>

      {/* Help modal */}
      {showHelpModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div
            className="rounded-lg p-6 w-96 border"
            style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#E2E4EB' }}>
                Having issues with your microphone?
              </h3>
              <button onClick={() => setShowHelpModal(false)} className="cursor-pointer">
                <X size={16} style={{ color: '#7E8494' }} />
              </button>
            </div>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: '#7E8494' }}>
              If your microphone isn't working, you can switch to text-based responses for this
              interview. Your typed responses will be evaluated by AI in the same way.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setUseTextMode(true);
                  setState('idle');
                  setShowHelpModal(false);
                }}
                className="flex-1 py-2.5 text-sm text-white rounded cursor-pointer transition-colors"
                style={{ backgroundColor: '#7C6AEF' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#9585F5'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7C6AEF'; }}
              >
                Switch to Text Responses
              </button>
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2.5 text-sm border rounded cursor-pointer transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#7E8494' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1D202A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulse { from { transform: scaleY(0.5); } to { transform: scaleY(1.2); } }
      `}</style>
    </div>
  );
}