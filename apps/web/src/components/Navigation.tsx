import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import Button from './Button';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '🏠' },
  { label: 'Training', href: '/training', icon: '🏃' },
  { label: 'Statistics', href: '/statistics', icon: '📊' },
  { label: 'Nutrition', href: '/nutrition', icon: '🥗' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Navigation() {
  const location = useLocation();
  const { user, profile, logout } = useAuthStore();
  const { toggleSidebar } = useUiStore();

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3" role="navigation" aria-label="Main navigation">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo + mobile menu toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-600">NOVA</span>
            <span className="text-xl font-light text-gray-600">COACH</span>
          </Link>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${isActive(item.href)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              <span className="mr-1.5" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-3">
          {profile && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-xs">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span>{user?.email}</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  );
}
