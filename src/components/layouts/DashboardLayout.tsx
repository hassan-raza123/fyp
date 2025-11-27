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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

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
    setShowLogoutDialog(false);
    await logout();
  };

  // Get role-based settings path
  const getSettingsPath = () => {
    if (role === 'admin') return '/admin/settings';
    if (role === 'faculty') return '/faculty/settings';
    if (role === 'student') return '/student/settings';
    // Super admin doesn't have a settings page, redirect to admin settings as fallback
    if (role === 'super_admin') return '/admin/settings';
    return '/admin/settings';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary dark:border-secondary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Enhanced Design with Proper Theme Classes */}
      <aside
        className={`
        fixed top-0 left-0 h-full
        transition-all duration-300 ease-in-out
        backdrop-blur-md
        ${isDarkMode 
          ? 'bg-gradient-to-b from-gray-900 via-gray-900/98 to-gray-900/95' 
          : 'bg-gradient-to-b from-white via-white/98 to-gray-50/95'
        }
        border-r ${isDarkMode ? 'border-gray-800/60' : 'border-gray-200/60'}
        ${isDarkMode 
          ? 'shadow-[4px_0_20px_rgba(0,0,0,0.4),2px_0_8px_rgba(252,153,40,0.1)]' 
          : 'shadow-[4px_0_20px_rgba(0,0,0,0.08),2px_0_8px_rgba(38,40,149,0.05)]'
        }
        ${isSidebarOpen ? 'w-64' : 'w-16'}
        ${!isSidebarOpen && 'lg:w-16'}
        ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }
        z-50
      `}
      >
        {/* Sidebar Header - Enhanced Design with Theme Classes */}
        <div className={`h-16 flex-shrink-0 flex items-center px-4 border-b ${isDarkMode ? 'border-gray-800/60' : 'border-gray-200/60'} ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800/50' : 'bg-gradient-to-br from-white via-white to-gray-50/50'}`}>
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
            <div className="relative w-10 h-10 flex items-center justify-center">
              {/* Orange Spot Behind Logo - Only in Dark Mode, Top Section Only */}
              {isDarkMode && (
                <div 
                  className="absolute top-0 left-1/2 rounded-full blur-xl"
                  style={{ 
                    background: 'var(--secondary-700)', // Darker orange from global
                    width: '28px',
                    height: '28px',
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
              <h1 className={`font-bold text-lg tracking-tight transition-all duration-300 group-hover:opacity-80 ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isDarkMode ? 'drop-shadow-[0_2px_4px_rgba(252,153,40,0.2)]' : ''}`}>
                EduTrack
              </h1>
            )}
          </Link>
        </div>

        {/* Navigation - Compact */}
        <nav 
          className="px-3 py-3 overflow-y-auto flex-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: `${isDarkMode ? 'var(--gray-700)' : 'var(--gray-300)'} transparent`,
          } as React.CSSProperties}
        >
          {navigationSections.map((section, idx) => (
            <div key={idx} className="mb-4">
              {isSidebarOpen && (
                <h2 className={`px-2 mb-2 text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
        {/* Compact Header - Enhanced Design with Theme Classes */}
        <header className={`h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 backdrop-blur-md ${isDarkMode ? 'bg-gradient-to-r from-gray-900/98 via-gray-900/95 to-gray-900/98 border-b border-gray-800/60 shadow-[0_4px_20px_rgba(0,0,0,0.3),0_2px_8px_rgba(252,153,40,0.1)]' : 'bg-gradient-to-r from-white/98 via-white/95 to-white/98 border-b border-gray-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.08),0_2px_8px_rgba(38,40,149,0.05)]'} transition-all duration-200`}>
          <div className="flex items-center flex-1 min-w-0 gap-2">
            {/* Menu Toggle Button */}
            <button
              className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'text-gray-300 hover:text-orange-400 hover:bg-orange-500/10' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-500/10'} hover:scale-105 active:scale-95`}
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
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10" 
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
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none transition-all duration-200 ${isDarkMode ? 'bg-gray-800/70 text-white border-gray-700/50 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 focus:bg-gray-800/90' : 'bg-gray-100/80 text-gray-900 border-gray-200/60 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/95'} backdrop-blur-sm shadow-sm focus:shadow-md`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className={`md:hidden p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'text-gray-300 hover:text-orange-400 hover:bg-orange-500/10' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-500/10'} hover:scale-105 active:scale-95`}
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
                className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'text-gray-300 hover:text-orange-400 hover:bg-orange-500/10' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-500/10'} hover:scale-105 active:scale-95`}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            {/* Notifications */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg transition-all duration-200 relative ${isDarkMode ? 'text-gray-300 hover:text-orange-400 hover:bg-orange-500/10' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-500/10'} hover:scale-105 active:scale-95`}
              >
                <Bell size={18} />
                {/* Notification Badge */}
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
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
                  className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shadow-lg transition-transform duration-200 hover:scale-110"
                  style={{
                    background: isDarkMode
                      ? `linear-gradient(135deg, var(--orange), var(--orange-dark))`
                      : `linear-gradient(135deg, var(--blue), var(--blue-dark))`,
                    boxShadow: isDarkMode 
                      ? '0 4px 12px rgba(252, 153, 40, 0.3)' 
                      : '0 4px 12px rgba(38, 40, 149, 0.2)'
                  }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
              </button>

              {/* Profile Menu Dropdown - Image Style with Theme Classes */}
              {showProfileMenu && (
                <div className={`absolute right-0 mt-2 w-64 rounded-2xl z-50 transform transition-all duration-200 origin-top-right overflow-hidden backdrop-blur-md ${isDarkMode ? 'bg-gray-900/95 border border-gray-800/60 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.4),0_10px_10px_-5px_rgba(252,153,40,0.1)]' : 'bg-white/95 border border-gray-200/60 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(38,40,149,0.05)]'}`}>
                  {/* User Info Section */}
                  <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-800/60 bg-gradient-to-r from-gray-900/50 to-transparent' : 'border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-transparent'}`}>
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user?.userData.firstName} {user?.userData.lastName}
                    </p>
                    <p className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    {/* Profile */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        router.push(getSettingsPath());
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm relative transition-all duration-200 group ${isDarkMode ? 'text-white hover:bg-gray-800/50' : 'text-gray-900 hover:bg-gray-100/50'} rounded-lg mx-1`}
                    >
                      <User className={`w-4 h-4 transition-colors ${isDarkMode ? 'group-hover:text-orange-400' : 'group-hover:text-blue-600'}`} />
                      <span className="flex-1 text-left font-medium">Profile</span>
                      <div className={`absolute right-0 top-0 bottom-0 w-1 rounded-l-full transition-opacity duration-200 ${isDarkMode ? 'bg-orange-500' : 'bg-blue-500'} opacity-0 group-hover:opacity-100`}></div>
                    </button>

                    {/* Divider */}
                    <div className={`h-px my-1 mx-2 ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200/60'}`} />

                    {/* Settings */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        router.push(getSettingsPath());
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm relative transition-all duration-200 group ${isDarkMode ? 'text-white hover:bg-gray-800/50' : 'text-gray-900 hover:bg-gray-100/50'} rounded-lg mx-1`}
                    >
                      <Settings className={`w-4 h-4 transition-colors ${isDarkMode ? 'group-hover:text-orange-400' : 'group-hover:text-blue-600'}`} />
                      <span className="flex-1 text-left font-medium">Settings</span>
                      <div className={`absolute right-0 top-0 bottom-0 w-1 rounded-l-full transition-opacity duration-200 ${isDarkMode ? 'bg-orange-500' : 'bg-blue-500'} opacity-0 group-hover:opacity-100`}></div>
                    </button>

                    {/* Divider */}
                    <div className={`h-px my-1 mx-2 ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200/60'}`} />

                    {/* Log out */}
                    <button
                      onClick={() => setShowLogoutDialog(true)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm relative transition-all duration-200 group ${isDarkMode ? 'text-white hover:bg-red-500/10 hover:text-red-400' : 'text-gray-900 hover:bg-red-50 hover:text-red-600'} rounded-lg mx-1`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="flex-1 text-left font-medium">Log out</span>
                      <div className="absolute right-0 top-0 bottom-0 w-1 rounded-l-full transition-opacity duration-200 bg-red-500 opacity-0 group-hover:opacity-100"></div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content - Enhanced Design with Theme Classes */}
        <main className={`p-6 min-h-[calc(100vh-112px)] transition-colors duration-200 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800/30' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50/50'} ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_50%,rgba(38,40,149,0.05),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(252,153,40,0.05),transparent_50%)]' : 'bg-[radial-gradient(circle_at_20%_50%,rgba(38,40,149,0.03),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(252,153,40,0.03),transparent_50%)]'}`}>
          {children}
        </main>

        {/* Full Page Footer - Fixed at Bottom */}
        <footer className={`h-12 flex items-center justify-center px-4 lg:px-6 sticky bottom-0 z-40 backdrop-blur-md ${isDarkMode ? 'bg-gradient-to-r from-gray-900/98 via-gray-900/95 to-gray-900/98 border-t border-gray-800/60 shadow-[0_-4px_20px_rgba(0,0,0,0.3),0_-2px_8px_rgba(252,153,40,0.1)]' : 'bg-gradient-to-r from-white/98 via-white/95 to-white/98 border-t border-gray-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08),0_-2px_8px_rgba(38,40,149,0.05)]'} transition-all duration-200`}>
          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            © {new Date().getFullYear()} EduTrack. All rights reserved.
          </p>
        </footer>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="bg-card border-card-border">
          <DialogHeader>
            <DialogTitle className="text-primary-text">Confirm Logout</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Are you sure you want to logout? You will need to login again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              className="border-card-border transition-all bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="text-white"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                borderColor: '#dc2626',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
