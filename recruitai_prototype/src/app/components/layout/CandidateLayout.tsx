import { Outlet, useNavigate, useLocation } from 'react-router';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const stages = [
  { label: 'Voice Interview', path: '/candidate/voice-interview' },
  { label: 'Coding Test', path: '/candidate/coding-test' },
  { label: 'System Design', path: '/candidate/system-design' },
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function CandidateLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isLobby = location.pathname === '/candidate' || location.pathname === '/candidate/';
  const isConfirmation = location.pathname === '/candidate/confirmation';
  const isProfile = location.pathname === '/candidate/profile';

  const currentStageIndex = stages.findIndex(s => location.pathname.startsWith(s.path));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F1117' }}>
      {/* Top navigation bar */}
      <header className="border-b" style={{ backgroundColor: '#13151D', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ backgroundColor: '#7C6AEF' }}
            >
              <span className="text-white text-xs font-semibold">R</span>
            </div>
            <span className="text-base font-semibold" style={{ color: '#E2E4EB' }}>RecruitAI</span>
          </div>

          {/* Progress indicator - center (hidden on small screens) */}
          {!isLobby && !isConfirmation && !isProfile && (
            <div className="hidden sm:flex items-center gap-2">
              {stages.map((stage, i) => (
                <div key={stage.path} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={
                        i === currentStageIndex
                          ? { backgroundColor: '#7C6AEF', color: '#fff' }
                          : i < currentStageIndex
                          ? { backgroundColor: '#3ECF8E', color: '#fff' }
                          : { backgroundColor: '#1D202A', color: '#7E8494' }
                      }
                    >
                      {i + 1}
                    </div>
                    <span
                      className="text-sm hidden md:inline"
                      style={{
                        color: i === currentStageIndex ? '#E2E4EB' : i < currentStageIndex ? '#3ECF8E' : '#7E8494',
                        opacity: i > currentStageIndex ? 0.6 : 1,
                      }}
                    >
                      {stage.label}
                    </span>
                  </div>
                  {i < stages.length - 1 && (
                    <div className="w-6 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* User info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/candidate/profile')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold transition-all cursor-pointer"
              style={{ backgroundColor: '#7C6AEF' }}
              title="View profile"
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px #9585F5';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '';
              }}
            >
              {user ? getInitials(user.name) : 'U'}
            </button>
            <span className="text-sm hidden sm:inline" style={{ color: '#7E8494' }}>{user?.name || 'Candidate'}</span>
            <button
              onClick={handleLogout}
              className="transition-colors cursor-pointer"
              style={{ color: '#7E8494' }}
              title="Log out"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7C6AEF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7E8494'; }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
