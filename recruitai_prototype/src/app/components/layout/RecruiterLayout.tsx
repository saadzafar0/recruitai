import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, Users, Mic, Code2, Settings, LogOut, Bell, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/recruiter' },
  { label: 'Candidates', icon: Users, to: '/recruiter/candidates' },
  { label: 'Interviews', icon: Mic, to: '/recruiter/interviews' },
  { label: 'Assessments', icon: Code2, to: '/recruiter/assessments' },
  { label: 'Settings', icon: Settings, to: '/recruiter/settings' },
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function RecruiterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0F1117' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col h-full transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:flex-shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#0B0D13' }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ backgroundColor: '#7C6AEF' }}
            >
              <span className="text-white text-xs font-semibold">R</span>
            </div>
            <span className="text-white text-base font-semibold tracking-tight">RecruitAI</span>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/recruiter'}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'text-white border-l-2 pl-2.5'
                    : 'text-gray-400'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { borderColor: '#7C6AEF', backgroundColor: 'rgba(124,106,239,0.15)' }
                  : {}
              }
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                if (!el.classList.contains('text-white')) {
                  el.style.backgroundColor = 'rgba(124,106,239,0.1)';
                  el.style.color = '#E2E4EB';
                  el.style.borderLeft = '2px solid #7C6AEF';
                  el.style.paddingLeft = '10px';
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                if (!el.classList.contains('text-white')) {
                  el.style.backgroundColor = '';
                  el.style.color = '';
                  el.style.borderLeft = '';
                  el.style.paddingLeft = '';
                }
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User at bottom */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-3 py-2">
            <button
              onClick={() => { navigate('/recruiter/profile'); closeSidebar(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold transition-all cursor-pointer"
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
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || 'Recruiter'}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header
          className="h-14 flex items-center justify-between px-4 sm:px-6 border-b flex-shrink-0"
          style={{ backgroundColor: '#13151D', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden transition-colors cursor-pointer"
            style={{ color: '#7E8494' }}
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <button
              className="transition-colors cursor-pointer"
              style={{ color: '#7E8494' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7C6AEF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7E8494'; }}
            >
              <Bell size={18} />
            </button>
            <button
              onClick={() => navigate('/recruiter/profile')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold transition-all cursor-pointer"
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
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
