'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  Search,
  LogOut,
  Settings,
  User,
  ChevronRight,
  ChevronLeft,
  Home,
  Users,
  Calendar,
  BookOpen,
  BarChart2,
  FileText,
  PlusCircle,
  Filter,
  Download,
  TrendingUp,
  Sun,
  Moon,
  Layers,
  GraduationCap,
  UserCheck,
  AlertCircle,
  Check,
  X,
  Eye,
  Edit,
  Trash2,
  Plus,
  ArrowRight,
  Star,
  Goal,
  Target,
  Award,
  BookCheck,
  List,
  Grid,
  HelpCircle,
  Settings2,
  Building2,
  Link as LinkIcon,
  LayoutDashboard,
  UserCog,
} from 'lucide-react';
import { LucideProps } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/app/actions/auth';
import { useAuth } from '@/hooks/useAuth';
import { roleBasedNavigation } from '@/config/navigation';
import { useTheme } from 'next-themes';

interface SidebarNavLinkProps {
  item: {
    id: string;
    label: string;
    icon: React.ForwardRefExoticComponent<
      Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
    >;
    badge?: string;
    href?: string;
  };
  isChild?: boolean;
  activeTab: string;
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  setActiveTab: (id: string) => void;
}

const SidebarNavLink = ({
  item,
  isChild = false,
  activeTab,
  isSidebarOpen,
  isDarkMode,
  setActiveTab,
}: SidebarNavLinkProps) => {
  const router = useRouter();
  const isActive = activeTab === item.id;

  return (
    <button
      onClick={() => {
        setActiveTab(item.id);
        if (item.href) {
          router.push(item.href);
        }
      }}
      className={`
        w-full flex items-center gap-2.5 px-2.5 py-2 relative rounded-md
        transition-all duration-200
        ${isChild ? 'pl-6' : ''}
        group
      `}
      style={{
        color: isActive
          ? isDarkMode 
            ? 'var(--orange)' // Orange for active in dark mode
            : 'var(--blue)' // Blue for active in light mode
          : isDarkMode
          ? 'var(--gray-400)'
          : 'var(--gray-600)',
        backgroundColor: isActive
          ? isDarkMode
            ? 'var(--brand-secondary-opacity-20)' // Orange background in dark mode
            : 'var(--brand-primary-opacity-10)' // Blue background in light mode
          : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = isDarkMode
            ? 'var(--brand-secondary-opacity-10)' // Orange hover in dark mode
            : 'var(--brand-primary-opacity-10)'; // Blue hover in light mode
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {/* Vertical bar for active item - Orange in dark mode, Blue in light mode */}
      {isActive && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
          style={{
            backgroundColor: isDarkMode ? 'var(--orange)' : 'var(--blue)',
          }}
        />
      )}
      
      {/* Icon */}
      <item.icon
        className={`flex-shrink-0 ${isSidebarOpen ? 'w-4 h-4' : 'w-5 h-5'}`}
        style={{
          color: isActive 
            ? isDarkMode 
              ? 'var(--orange)' 
              : 'var(--blue)' 
            : 'currentColor',
        }}
      />
      
      {/* Label */}
      {isSidebarOpen && (
        <span className="flex-1 text-left font-medium text-xs">{item.label}</span>
      )}
      
      {/* Badge */}
      {item.badge && isSidebarOpen && (
        <span
          className="px-1.5 py-0.5 text-[10px] rounded-full font-semibold"
          style={{
            backgroundColor: isActive 
              ? isDarkMode 
                ? 'var(--brand-secondary-opacity-20)' 
                : 'var(--brand-primary-opacity-20)'
              : isDarkMode
              ? 'var(--brand-secondary-opacity-10)'
              : 'var(--brand-primary-opacity-10)',
            color: isActive
              ? isDarkMode 
                ? 'var(--orange)' 
                : 'var(--blue)'
              : isDarkMode
              ? 'var(--orange)'
              : 'var(--blue)',
          }}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Core States
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, role } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Theme from next-themes
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Use resolvedTheme to handle 'system' theme properly
  const isDarkMode = resolvedTheme === 'dark';
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get navigation items based on user role
  const navigationSections = role
    ? roleBasedNavigation[role as keyof typeof roleBasedNavigation] || []
    : [];

  // Refs for click outside
  const searchRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  // Handle logout using server action
  const handleLogout = async () => {
    await logout();
  };

  // Update active tab based on URL
  useEffect(() => {
    // Find the matching navigation item
    const findActiveTab = () => {
      // Handle root/admin dashboard
      if (
        pathname === '/admin' ||
        pathname === '/faculty' ||
        pathname === '/student'
      ) {
        return 'overview';
      }

      // Find the best matching navigation item
      let bestMatch: { item: any; priority: number } | null = null;

      for (const section of navigationSections) {
        for (const item of section.items) {
          if (!item.href) continue;

          // Exact match has highest priority
          if (pathname === item.href) {
            return item.id;
          }

          // Check if pathname starts with item href (for sub-routes)
          // e.g., '/admin/students' matches '/admin/students/create' or '/admin/students/123'
          if (
            pathname.startsWith(item.href + '/') ||
            pathname.startsWith(item.href + '?')
          ) {
            const priority = item.href.split('/').length; // Longer paths have higher priority
            if (!bestMatch || priority > bestMatch.priority) {
              bestMatch = { item, priority };
            }
          }
        }
      }

      // Return best match if found, otherwise default to overview
      return bestMatch ? bestMatch.item.id : 'overview';
    };

    setActiveTab(findActiveTab());
  }, [pathname, navigationSections]); // Update when pathname or navigation changes

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // While auth is loading or role not yet resolved, avoid flashing wrong sidebar
  if (loading || !role || !mounted) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          backgroundColor: mounted && isDarkMode ? 'var(--gray-900)' : 'var(--gray-50)' 
        }}
      >
        <div className="flex flex-col items-center space-y-3">
          <div 
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderColor: 'var(--blue)',
              borderTopColor: 'transparent',
            }}
          />
          <p 
            className="text-sm"
            style={{ 
              color: mounted && isDarkMode ? 'var(--gray-400)' : 'var(--gray-500)' 
            }}
          >
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: isDarkMode ? 'var(--gray-900)' : 'var(--gray-50)',
      }}
    >
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 h-full
        transition-all duration-300 ease-in-out
        border-r
        ${isSidebarOpen ? 'w-64' : 'w-16'}
        ${!isSidebarOpen && 'lg:w-16'}
        ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }
        z-50
      `}
        style={{
          backgroundColor: isDarkMode 
            ? 'var(--gray-900)' 
            : 'var(--white)',
          borderColor: isDarkMode ? 'var(--gray-800)' : 'var(--gray-200)',
        }}
      >
        {/* Sidebar Header - Compact */}
        <div
          className="h-16 flex items-center px-4 border-b"
          style={{
            borderColor: isDarkMode ? 'var(--gray-800)' : 'var(--gray-200)',
          }}
        >
          <Link
            href={
              role === 'super_admin' ? '/super-admin' :
              role === 'admin' ? '/admin' :
              role === 'faculty' ? '/faculty' :
              role === 'student' ? '/student' :
              '/'
            }
            className="flex items-center gap-2.5 group cursor-pointer"
            onClick={() => setActiveTab('overview')}
          >
            {/* Logo with Orange Spot in Dark Mode */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              {/* Orange Spot Behind Logo - Only in Dark Mode, Top Section Only */}
              {isDarkMode && (
                <div 
                  className="absolute top-0 left-1/2 rounded-full blur-xl"
                  style={{ 
                    background: 'var(--orange-dark)',
                    width: '24px',
                    height: '24px',
                    transform: 'translateX(-50%) translateY(-6px)',
                    opacity: 1,
                    zIndex: 0,
                  }}
                />
              )}
              
              {/* Logo */}
              <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ zIndex: 1 }}
              >
                <img
                  src="/logo's/logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain relative"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                    zIndex: 2,
                  }}
                />
              </div>
            </div>

            {/* App Name */}
            {isSidebarOpen && (
              <h1
                className="font-bold text-lg tracking-tight transition-colors duration-300 group-hover:opacity-80"
                style={{
                  color: isDarkMode ? 'var(--white)' : 'var(--gray-900)',
                }}
              >
                EduTrack
              </h1>
            )}
          </Link>
        </div>

        {/* Navigation - Compact */}
        <nav 
          className="px-3 py-3 overflow-y-auto max-h-[calc(100vh-64px)]"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: `${isDarkMode ? 'var(--gray-700)' : 'var(--gray-300)'} transparent`,
          } as React.CSSProperties}
        >
          {navigationSections.map((section, idx) => (
            <div key={idx} className="mb-4">
              {isSidebarOpen && (
                <h2
                  className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    color: isDarkMode ? 'var(--gray-400)' : 'var(--gray-500)',
                  }}
                >
                  {section.title}
                </h2>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarNavLink
                    key={item.id}
                    item={item}
                    activeTab={activeTab}
                    isSidebarOpen={isSidebarOpen}
                    isDarkMode={isDarkMode}
                    setActiveTab={setActiveTab}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

      </aside>

      {/* Main Content */}
      <div
        className={`
        transition-all duration-300
        ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}
        ml-0
      `}
      >
        {/* Compact Header */}
        <header
          className="h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 border-b"
          style={{
            backgroundColor: isDarkMode 
              ? 'var(--gray-900)' 
              : 'var(--white)',
            borderColor: isDarkMode ? 'var(--gray-800)' : 'var(--gray-200)',
          }}
        >
          <div className="flex items-center flex-1 min-w-0 gap-2">
            {/* Menu Toggle Button */}
            <button
              className="p-1.5 rounded-md transition-all duration-200"
              style={{
                color: isDarkMode ? 'var(--gray-400)' : 'var(--gray-600)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode 
                  ? 'var(--brand-secondary-opacity-10)' 
                  : 'var(--brand-primary-opacity-10)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={18} />
            </button>

            {/* Search Bar */}
            <div
              ref={searchRef}
              className={`
              relative flex-1 max-w-sm
              ${isMobileSearchOpen ? 'block' : 'hidden md:block'}
            `}
            >
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2"
                  size={14}
                  style={{
                    color: isDarkMode ? 'var(--gray-400)' : 'var(--gray-500)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-md text-sm focus:outline-none transition-all duration-200"
                  style={{
                    backgroundColor: isDarkMode 
                      ? 'var(--gray-800)' 
                      : 'var(--gray-100)',
                    color: isDarkMode ? 'var(--white)' : 'var(--gray-900)',
                    border: `1px solid ${isDarkMode ? 'var(--gray-700)' : 'transparent'}`,
                  }}
                  onFocus={(e) => {
                    const focusColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
                    e.currentTarget.style.borderColor = focusColor;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${isDarkMode ? 'var(--brand-secondary-opacity-20)' : 'var(--brand-primary-opacity-20)'}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isDarkMode ? 'var(--gray-700)' : 'transparent';
                    e.currentTarget.style.boxShadow = '';
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-1.5 rounded-md transition-all duration-200"
              style={{
                color: isDarkMode ? 'var(--gray-400)' : 'var(--gray-600)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode 
                  ? 'var(--brand-secondary-opacity-10)' 
                  : 'var(--brand-primary-opacity-10)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Search size={18} />
            </button>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => {
                  if (theme === 'system') {
                    // If system, switch to opposite of current resolved theme
                    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                  } else {
                    // Toggle between light and dark
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                  }
                }}
                className="p-1.5 rounded-md transition-all duration-200"
                style={{
                  color: isDarkMode ? 'var(--gray-400)' : 'var(--gray-600)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode 
                    ? 'var(--brand-secondary-opacity-10)' 
                    : 'var(--brand-primary-opacity-10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            {/* Notifications */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 rounded-md transition-all duration-200 relative"
                style={{
                  color: isDarkMode ? 'var(--gray-400)' : 'var(--gray-600)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode 
                    ? 'var(--brand-secondary-opacity-10)' 
                    : 'var(--brand-primary-opacity-10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Bell size={18} />
                {/* Notification Badge */}
                <span 
                  className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: '#ef4444',
                  }}
                ></span>
              </button>
            </div>

            {/* Profile Menu */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-0 rounded-full transition-all duration-200"
                onMouseEnter={(e) => {
                  const color = isDarkMode ? 'var(--orange)' : 'var(--blue)';
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${color}, 0 0 0 4px ${isDarkMode ? 'var(--gray-900)' : 'var(--white)'}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    background: isDarkMode
                      ? `linear-gradient(135deg, var(--orange), var(--orange-dark))`
                      : `linear-gradient(135deg, var(--blue), var(--blue-dark))`
                  }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
              </button>

              {/* Profile Menu Dropdown - Image Style */}
              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-xl z-50 transform transition-all duration-200 origin-top-right overflow-hidden"
                  style={{
                    backgroundColor: isDarkMode 
                      ? 'var(--gray-900)' 
                      : 'var(--white)',
                    border: `1px solid ${isDarkMode ? 'var(--gray-800)' : 'var(--gray-200)'}`,
                    boxShadow: isDarkMode
                      ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                      : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: isDarkMode ? 'var(--gray-800)' : 'var(--gray-200)' }}>
                    <p 
                      className="text-sm font-bold"
                      style={{
                        color: isDarkMode ? 'var(--white)' : 'var(--gray-900)',
                      }}
                    >
                      {user?.userData.firstName} {user?.userData.lastName}
                    </p>
                    <p 
                      className="text-xs mt-0.5 truncate"
                      style={{
                        color: isDarkMode ? 'var(--gray-400)' : 'var(--gray-500)',
                      }}
                    >
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    {/* Profile */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        router.push('/admin/settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm relative transition-all duration-200 group"
                      style={{
                        color: isDarkMode ? 'var(--white)' : 'var(--gray-900)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode 
                          ? 'var(--gray-800)' 
                          : 'var(--gray-100)';
                        // Show blue bar
                        const blueBar = e.currentTarget.querySelector('.blue-indicator');
                        if (blueBar) {
                          (blueBar as HTMLElement).style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        const blueBar = e.currentTarget.querySelector('.blue-indicator');
                        if (blueBar) {
                          (blueBar as HTMLElement).style.opacity = '0';
                        }
                      }}
                    >
                      <User className="w-4 h-4" />
                      <span className="flex-1 text-left">Profile</span>
                      <div 
                        className="blue-indicator absolute right-0 top-0 bottom-0 w-1 rounded-l-full transition-opacity duration-200"
                        style={{
                          backgroundColor: isDarkMode ? 'var(--orange)' : 'var(--blue)',
                          opacity: 0,
                        }}
                      ></div>
                    </button>

                    {/* Divider */}
                    <div 
                      className="h-px my-1"
                      style={{
                        backgroundColor: isDarkMode ? 'var(--gray-800)' : 'var(--gray-200)',
                      }}
                    />

                    {/* Settings */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        router.push('/admin/settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm relative transition-all duration-200 group"
                      style={{
                        color: isDarkMode ? 'var(--white)' : 'var(--gray-900)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode 
                          ? 'var(--gray-800)' 
                          : 'var(--gray-100)';
                        const blueBar = e.currentTarget.querySelector('.blue-indicator');
                        if (blueBar) {
                          (blueBar as HTMLElement).style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        const blueBar = e.currentTarget.querySelector('.blue-indicator');
                        if (blueBar) {
                          (blueBar as HTMLElement).style.opacity = '0';
                        }
                      }}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="flex-1 text-left">Settings</span>
                      <div 
                        className="blue-indicator absolute right-0 top-0 bottom-0 w-1 rounded-l-full transition-opacity duration-200"
                        style={{
                          backgroundColor: isDarkMode ? 'var(--orange)' : 'var(--blue)',
                          opacity: 0,
                        }}
                      ></div>
                    </button>

                    {/* Divider */}
                    <div 
                      className="h-px my-1"
                      style={{
                        backgroundColor: isDarkMode ? 'var(--gray-800)' : 'var(--gray-200)',
                      }}
                    />

                    {/* Log out */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm relative transition-all duration-200 group"
                      style={{
                        color: isDarkMode ? 'var(--white)' : 'var(--gray-900)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode 
                          ? 'var(--gray-800)' 
                          : 'var(--gray-100)';
                        const blueBar = e.currentTarget.querySelector('.blue-indicator');
                        if (blueBar) {
                          (blueBar as HTMLElement).style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        const blueBar = e.currentTarget.querySelector('.blue-indicator');
                        if (blueBar) {
                          (blueBar as HTMLElement).style.opacity = '0';
                        }
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="flex-1 text-left">Log out</span>
                      <div 
                        className="blue-indicator absolute right-0 top-0 bottom-0 w-1 rounded-l-full transition-opacity duration-200"
                        style={{
                          backgroundColor: isDarkMode ? 'var(--orange)' : 'var(--blue)',
                          opacity: 0,
                        }}
                      ></div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main 
          className="p-6 min-h-[calc(100vh-64px)]"
          style={{
            backgroundColor: isDarkMode ? 'var(--gray-900)' : 'var(--gray-50)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
