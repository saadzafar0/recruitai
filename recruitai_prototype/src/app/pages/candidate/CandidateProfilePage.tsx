import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, Briefcase, Upload, FileText, Eye, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CVData {
  fileName: string;
  uploadDate: string;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Mock CV viewer modal
function CVViewerModal({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div
        className="rounded-xl w-full max-w-lg overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(124,106,239,0.18)', backgroundColor: '#171921' }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: '#0B0D13' }}
        >
          <div className="flex items-center gap-2">
            <FileText size={15} style={{ color: '#E2E4EB' }} />
            <span className="text-sm font-medium" style={{ color: '#E2E4EB' }}>
              My CV — {name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-8 py-6">
          {/* Mock CV content */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
              style={{ backgroundColor: '#7C6AEF' }}
            >
              {getInitials(name)}
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#E2E4EB' }}>{name}</h3>
              <p className="text-sm" style={{ color: '#7C6AEF' }}>Senior Frontend Engineer</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase mb-2" style={{ color: '#7C6AEF', letterSpacing: '0.05em' }}>
                Summary
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: '#7E8494' }}>
                Experienced software engineer with 5+ years of expertise in building scalable
                web applications. Proficient in React, TypeScript, and Node.js ecosystems.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase mb-2" style={{ color: '#7C6AEF', letterSpacing: '0.05em' }}>
                Education
              </h4>
              <p className="text-sm" style={{ color: '#7E8494' }}>
                B.Sc. Computer Science — LUMS (2019)
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase mb-2" style={{ color: '#7C6AEF', letterSpacing: '0.05em' }}>
                Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {['React', 'TypeScript', 'Node.js', 'GraphQL', 'Docker', 'AWS'].map(s => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded border"
                    style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#7E8494' }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm text-white rounded transition-colors cursor-pointer"
            style={{ backgroundColor: '#7C6AEF' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#9585F5'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7C6AEF'; }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CandidateProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [showCVViewer, setShowCVViewer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      alert('Please upload a PDF or DOCX file.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    setCvData({ fileName: file.name, uploadDate: today });
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      {showCVViewer && user && (
        <CVViewerModal name={user.name} onClose={() => setShowCVViewer(false)} />
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Back button */}
        <button
          onClick={() => navigate('/candidate')}
          className="flex items-center gap-1.5 text-sm mb-6 transition-colors cursor-pointer"
          style={{ color: '#7E8494' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7C6AEF'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7E8494'; }}
        >
          <ArrowLeft size={15} />
          Back to Assessment Lobby
        </button>

        <h1 className="mb-6" style={{ fontSize: '1.375rem', fontWeight: 600, color: '#E2E4EB' }}>
          My Profile
        </h1>

        {/* Identity card */}
        <div
          className="rounded-lg p-6 border mb-5"
          style={{ borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', backgroundColor: '#171921' }}
        >
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0"
              style={{ backgroundColor: '#7C6AEF' }}
            >
              {user ? getInitials(user.name) : 'C'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#E2E4EB' }}>
                {user?.name || 'Candidate'}
              </h2>
              <span
                className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded"
                style={{ backgroundColor: '#1D202A', color: '#7C6AEF', fontWeight: 500 }}
              >
                Candidate
              </span>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div
          className="rounded-lg p-6 border mb-5"
          style={{ borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', backgroundColor: '#171921' }}
        >
          <h3 className="mb-4" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
            Account Details
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#1D202A' }}
              >
                <Mail size={14} style={{ color: '#7C6AEF' }} />
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#7E8494', opacity: 0.7 }}>Email</p>
                <p className="text-sm font-medium" style={{ color: '#E2E4EB' }}>
                  {user?.email || 'candidate@email.com'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#1D202A' }}
              >
                <Shield size={14} style={{ color: '#7C6AEF' }} />
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#7E8494', opacity: 0.7 }}>Role</p>
                <p className="text-sm font-medium" style={{ color: '#E2E4EB' }}>Candidate</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#1D202A' }}
              >
                <Briefcase size={14} style={{ color: '#7C6AEF' }} />
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#7E8494', opacity: 0.7 }}>Applied Position</p>
                <p className="text-sm font-medium" style={{ color: '#E2E4EB' }}>Senior Frontend Engineer</p>
              </div>
            </div>
          </div>
        </div>

        {/* CV Section */}
        <div
          className="rounded-lg p-6 border"
          style={{ borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', backgroundColor: '#171921' }}
        >
          <h3 className="mb-1" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
            My CV / Resume
          </h3>
          <p className="text-sm mb-5" style={{ color: '#7E8494', opacity: 0.7 }}>
            Upload your CV so recruiters can review your full background.
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleFileUpload}
          />

          {cvData ? (
            /* CV uploaded state */
            <div>
              <div
                className="flex items-center gap-4 p-4 rounded-lg border mb-4"
                style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#1D202A' }}
              >
                <div
                  className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#fff' }}
                >
                  <FileText size={18} style={{ color: '#7C6AEF' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#E2E4EB' }}>
                    {cvData.fileName}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#7E8494' }}>
                    Uploaded on {cvData.uploadDate}
                  </p>
                </div>
                <span
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded flex-shrink-0"
                  style={{ backgroundColor: 'rgba(62,207,142,0.08)', color: '#3ECF8E' }}
                >
                  <CheckCircle size={11} />
                  Uploaded
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCVViewer(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-white rounded transition-colors cursor-pointer"
                  style={{ backgroundColor: '#7C6AEF' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#9585F5'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7C6AEF'; }}
                >
                  <Eye size={14} />
                  View My CV
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm rounded border transition-colors cursor-pointer"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#7E8494' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#9585F5';
                    (e.currentTarget as HTMLElement).style.color = '#7C6AEF';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLElement).style.color = '#7E8494';
                  }}
                >
                  <Upload size={14} />
                  Replace CV
                </button>
              </div>
            </div>
          ) : (
            /* No CV uploaded state */
            <div>
              <div
                className="text-center py-10 rounded-lg border-2 border-dashed mb-5"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: '#1D202A' }}
                >
                  <FileText size={22} style={{ color: '#7C6AEF' }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: '#E2E4EB' }}>
                  No CV uploaded yet
                </p>
                <p className="text-sm" style={{ color: '#7E8494', opacity: 0.7 }}>
                  Upload your CV so recruiters can review it.
                </p>
                <p className="text-xs mt-1" style={{ color: '#7E8494', opacity: 0.5 }}>
                  Supported formats: PDF, DOCX
                </p>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 text-sm text-white rounded transition-colors cursor-pointer"
                  style={{ backgroundColor: '#7C6AEF' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#9585F5'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7C6AEF'; }}
                >
                  <Upload size={15} />
                  Upload CV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
