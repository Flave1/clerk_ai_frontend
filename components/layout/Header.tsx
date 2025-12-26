import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  PhoneIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  PuzzlePieceIcon,
  AdjustmentsHorizontalIcon,
  CodeBracketIcon,
  ArrowRightOnRectangleIcon,
  LinkIcon,
  UserCircleIcon,
  BellIcon,
  KeyIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  BeakerIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useUIStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/ui/Logo';

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Meetings', href: '/meetings', icon: VideoCameraIcon },
  { name: 'Voice Profile', href: '/voice-profile', icon: MicrophoneIcon },
  { name: 'Personality & Context', href: '/context-lab', icon: BeakerIcon },
  { name: 'Pricing', href: '/pricing', icon: CurrencyDollarIcon },
];

const integrationsNavigation = [
  { name: 'Connected Apps', href: '/integrations/connected', icon: LinkIcon },
];

const settingsNavigation = [
  // { name: 'General', href: '/settings', icon: AdjustmentsHorizontalIcon },
  { name: 'Profile', href: '/settings/profile', icon: UserCircleIcon },
  { name: 'Notifications', href: '/settings/notifications', icon: BellIcon },
];

const developerNavigation = [
  { name: 'API Keys', href: '/developer/api-keys', icon: KeyIcon },
  { name: 'APIs & Webhooks', href: '/developer/webhooks', icon: GlobeAltIcon },
  { name: 'Logs', href: '/developer/logs', icon: DocumentTextIcon },
];

export default function Header() {
  const router = useRouter();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { signOut: handleSignOut } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      
      // Initialize sidebar state based on screen size (only once on mount)
      if (!initialized) {
        setSidebarCollapsed(mobile); // Closed on mobile, open on desktop
        setInitialized(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [initialized, setSidebarCollapsed]);

  const handleNavClick = () => {
    // Only close sidebar on mobile devices
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  const renderNavItem = (item: typeof mainNavigation[0]) => {
    const isActive = router.pathname === item.href;
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={handleNavClick}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100'
        }`}
      >
        <item.icon className="h-5 w-5 mr-3" />
        {item.name}
      </Link>
    );
  };

  const renderNavSection = (title: string, items: typeof mainNavigation) => (
    <div className="mb-6">
      <h3 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavClick}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <Logo href="/dashboard" size="md" />
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            {renderNavSection('Main', mainNavigation)}
            {renderNavSection('Integrations', integrationsNavigation)}
            {renderNavSection('Settings', settingsNavigation)}
            {renderNavSection('Developer', developerNavigation)}
          </nav>

          {/* Sign Out Button */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center px-3 py-2 rounded-md text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Floating Sidebar Toggle Button - Only show when sidebar is closed */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200 transition-all duration-300"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
