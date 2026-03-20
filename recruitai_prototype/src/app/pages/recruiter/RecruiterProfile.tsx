import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, Building, Shield, Bell, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function RecruiterProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      {/* Back button */}
      <button
        onClick={() => navigate('/recruiter')}
        className="flex items-center gap-1.5 text-sm mb-6 transition-colors cursor-pointer"
        style={{ color: '#7E8494' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7C6AEF'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7E8494'; }}
      >
        <ArrowLeft size={15} />
        Back to Dashboard
      </button>

      <h1 className="mb-6" style={{ fontSize: '1.375rem', fontWeight: 600, color: '#E2E4EB' }}>
        My Profile
      </h1>

      {/* Identity card */}
      <div
        className="rounded-lg p-6 border mb-5"
        style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
      >
        <div className="flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0"
            style={{ backgroundColor: '#7C6AEF' }}
          >
            {user ? getInitials(user.name) : 'R'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#E2E4EB' }}>
              {user?.name || 'Recruiter'}
            </h2>
            <span
              className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded"
              style={{ backgroundColor: '#1D202A', color: '#7C6AEF', fontWeight: 500 }}
            >
              Recruiter
            </span>
          </div>
        </div>
      </div>

      {/* Contact & Company Info */}
      <div
        className="rounded-lg p-6 border mb-5"
        style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
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
                {user?.email || 'recruiter@company.com'}
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
              <p className="text-sm font-medium" style={{ color: '#E2E4EB' }}>Recruiter</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#1D202A' }}
            >
              <Building size={14} style={{ color: '#7C6AEF' }} />
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#7E8494', opacity: 0.7 }}>Company</p>
              <p className="text-sm font-medium" style={{ color: '#E2E4EB' }}>TechCorp Inc.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div
        className="rounded-lg p-6 border"
        style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
      >
        <h3 className="mb-4" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
          Account Settings
        </h3>
        <div className="space-y-4">
          {[
            { icon: Bell, label: 'Email Notifications', description: 'Receive alerts for new applications and status changes', value: notifications, toggle: setNotifications },
            { icon: Moon, label: 'Dark Mode', description: 'Switch to a darker interface theme', value: darkMode, toggle: setDarkMode },
            { icon: Shield, label: 'Two-Factor Authentication', description: 'Add an extra layer of security to your account', value: twoFactor, toggle: setTwoFactor },
          ].map(({ icon: Icon, label, description, value, toggle }) => (
            <div key={label} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#1D202A' }}
                >
                  <Icon size={14} style={{ color: '#7C6AEF' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#E2E4EB' }}>{label}</p>
                  <p className="text-xs" style={{ color: '#7E8494', opacity: 0.7 }}>{description}</p>
                </div>
              </div>
              <button
                onClick={() => toggle((v: boolean) => !v)}
                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer flex-shrink-0"
                style={{ backgroundColor: value ? '#7C6AEF' : '#1D202A' }}
              >
                <span
                  className="inline-block w-3.5 h-3.5 rounded-full bg-white transition-transform"
                  style={{ transform: value ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
