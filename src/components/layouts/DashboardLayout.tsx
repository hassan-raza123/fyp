'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PRODUCT_NAME } from '@/constants/branding';
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
            backgroundColor: 'var(--accent)',
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

  /**
   * Header search: jump to a page.
   *
   * The box used to bind `searchTerm` and never read it again — a prominent
   * control on every dashboard that did nothing. Searching the navigation the
   * current role actually has is the behaviour that works for all four roles
   * without guessing which listing endpoint a given term belongs to.
   */
  const searchMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    return navigationSections
      .flatMap((section) =>
        section.items.map((item) => ({ ...item, section: section.title }))
      )
      .filter((item) => item.label.toLowerCase().includes(term))
      .slice(0, 8);
  }, [searchTerm, navigationSections]);

  const goToMatch = (href: string) => {
    setSearchTerm('');
    setIsMobileSearchOpen(false);
    router.push(href);
  };

  // Notifications shown in the bell panel
  const [notifications, setNotifications] = useState<
    Array<{ id: number; title: string; message: string; isRead: boolean; createdAt: string }>
  >([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    if (!showNotifications) return;

    let cancelled = false;
    setNotificationsLoading(true);

    fetch('/api/notifications?limit=5', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((body) => {
        if (cancelled) return;
        const list = Array.isArray(body?.data) ? body.data : [];
        setNotifications(list.slice(0, 5));
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      })
      .finally(() => {
        if (!cancelled) setNotificationsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showNotifications]);

  const notificationsHref =
    role === 'super_admin' ? '/super-admin' : `/${role}/notifications`;

  // Handle logout using server action
  const handleLogout = async () => {
    setShowLogoutDialog(false);
    await logout();
  };

  // Get role-based profile path
  const getProfilePath = () => {
    if (role === 'admin') return '/admin/profile';
    if (role === 'faculty') return '/faculty/profile';
    if (role === 'student') return '/student/profile';
    if (role === 'super_admin') return '/super-admin/profile';
    return '/admin/profile';
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
      <div className="min-h-screen flex items-center justify-center bg-surface-2 dark:bg-surface transition-colors duration-200">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary dark:border-secondary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-muted dark:text-ink-muted">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page dark:bg-surface transition-colors duration-200">
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
        flex flex-col
        transition-all duration-300 ease-in-out
        backdrop-blur-md
        ${isDarkMode 
          ? 'bg-gradient-to-b from-ink via-ink/98 to-ink/95' 
          : 'bg-gradient-to-b from-white via-white/98 to-surface-2/95'
        }
        border-r ${'border-subtle/60'}
        ${isDarkMode 
          ? 'shadow-[4px_0_20px_rgba(0,0,0,0.4),2px_0_8px_var(--brand-primary-opacity-10)]' 
          : 'shadow-[4px_0_20px_rgba(0,0,0,0.08),2px_0_8px_var(--brand-primary-opacity-06)]'
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
        <div className={`h-16 flex-shrink-0 flex items-center px-4 border-b ${'border-subtle/60'} ${isDarkMode ? 'bg-gradient-to-br from-ink via-ink to-ink/50' : 'bg-gradient-to-br from-white via-white to-surface-2/50'}`}>
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
              <h1 className={`font-bold text-lg tracking-tight transition-all duration-300 group-hover:opacity-80 ${'text-ink'} ${isDarkMode ? 'drop-shadow-[0_2px_4px_var(--brand-primary-opacity-20)]' : ''}`}>
                {PRODUCT_NAME}
              </h1>
            )}
          </Link>
        </div>

        {/* Navigation - Compact */}
        <nav 
          className="px-3 py-3 overflow-y-auto flex-1 min-h-0"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: `${'var(--border-firm)'} transparent`,
            maxHeight: 'calc(100vh - 4rem)',
          } as React.CSSProperties}
        >
          {navigationSections.map((section, idx) => (
            <div key={idx} className="mb-4">
              {isSidebarOpen && (
                <h2 className={`px-2 mb-2 text-[10px] font-bold uppercase tracking-widest ${'text-ink-muted'}`}>
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
        <header className={`h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 backdrop-blur-md ${isDarkMode ? 'bg-gradient-to-r from-ink/98 via-ink/95 to-ink/98 border-b border-subtle/60 shadow-[0_4px_20px_rgba(0,0,0,0.3),0_2px_8px_var(--brand-primary-opacity-10)]' : 'bg-gradient-to-r from-white/98 via-white/95 to-white/98 border-b border-subtle/60 shadow-[0_4px_20px_rgba(0,0,0,0.08),0_2px_8px_var(--brand-primary-opacity-06)]'} transition-all duration-200`}>
          <div className="flex items-center flex-1 min-w-0 gap-2">
            {/* Menu Toggle Button */}
            <button
              className={`p-2 rounded-lg transition-all duration-200 ${'text-ink-2 hover:text-primary hover:bg-primary/10'} hover:scale-105 active:scale-95`}
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
              aria-expanded={isSidebarOpen}
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
              {/*
                Deliberately not role="combobox": that contract requires managed
                focus and aria-activedescendant, neither of which this
                implements. A labelled search input that points at its own
                results list is honest about what it is — and claiming the role
                also made this element the first match for every
                `getByRole('combobox')` on the page.
              */}
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10"
                  size={14}
                  style={{
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  aria-label="Search pages"
                  aria-describedby="header-search-results"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchMatches.length > 0) {
                      e.preventDefault();
                      goToMatch(searchMatches[0].href);
                    }
                    if (e.key === 'Escape') setSearchTerm('');
                  }}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none transition-all duration-200 ${isDarkMode ? 'bg-surface-2/70 text-white border-subtle/50 focus:border-warn/50 focus:ring-2 focus:ring-warn/20 focus:bg-surface-2/90' : 'bg-surface-2/80 text-ink border-subtle/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-white/95'} backdrop-blur-sm shadow-sm focus:shadow-md`}
                />
              </div>

              {searchTerm.trim() && (
                <div
                  id="header-search-results"
                  role="listbox"
                  className={`absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border shadow-lg ${'border-subtle bg-surface'}`}
                >
                  {searchMatches.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-ink-muted">
                      No matches found
                    </p>
                  ) : (
                    searchMatches.map((match) => (
                      <button
                        key={match.href}
                        role="option"
                        aria-selected={false}
                        onClick={() => goToMatch(match.href)}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${'text-ink hover:bg-surface-2'}`}
                      >
                        <span>{match.label}</span>
                        <span className="text-xs text-ink-muted">
                          {match.section}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              aria-label='Search'
              aria-expanded={isMobileSearchOpen}
              className={`md:hidden p-2 rounded-lg transition-all duration-200 ${'text-ink-2 hover:text-primary hover:bg-primary/10'} hover:scale-105 active:scale-95`}
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
                className={`p-2 rounded-lg transition-all duration-200 ${'text-ink-2 hover:text-primary hover:bg-primary/10'} hover:scale-105 active:scale-95`}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            {/* Notifications */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label='Notifications'
                aria-expanded={showNotifications}
                className={`p-2 rounded-lg transition-all duration-200 relative ${'text-ink-2 hover:text-primary hover:bg-primary/10'} hover:scale-105 active:scale-95`}
              >
                <Bell size={18} />
                {/* Notification Badge */}
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-bad ring-2 ring-white dark:ring-subtle"></span>
              </button>

              {/*
                The bell set `aria-expanded` and rendered nothing — it announced
                a panel to a screen reader that did not exist.
              */}
              {showNotifications && (
                <div
                  role="menu"
                  aria-label="Notifications"
                  className={`absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border shadow-lg ${'border-subtle bg-surface'}`}
                >
                  <div
                    className={`border-b px-4 py-2.5 text-sm font-medium ${'border-subtle text-ink'}`}
                  >
                    Notifications
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notificationsLoading ? (
                      <p className="px-4 py-6 text-center text-sm text-ink-muted">
                        Loading…
                      </p>
                    ) : notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-ink-muted">
                        You have no notifications
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          role="menuitem"
                          tabIndex={0}
                          className={`border-b px-4 py-3 last:border-b-0 ${'border-subtle'}`}
                        >
                          <p
                            className={`text-sm ${n.isRead ? 'font-normal' : 'font-semibold'} ${'text-ink'}`}
                          >
                            {n.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      router.push(notificationsHref);
                    }}
                    className={`w-full border-t px-4 py-2.5 text-sm font-medium transition-colors ${'border-subtle text-primary hover:bg-surface-2'}`}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label='Account menu'
                aria-expanded={showProfileMenu}
                className="p-0 rounded-full transition-all duration-200"
                onMouseEnter={(e) => {
                  const color = 'var(--accent)';
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${color}, 0 0 0 4px ${'var(--surface)'}`;
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
                      ? '0 4px 12px var(--brand-primary-opacity-30)' 
                      : '0 4px 12px var(--brand-primary-opacity-20)'
                  }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
              </button>

              {/* Profile Menu Dropdown - Image Style with Theme Classes */}
              {showProfileMenu && (
                <div className={`absolute right-0 mt-2 w-64 rounded-2xl z-50 transform transition-all duration-200 origin-top-right overflow-hidden backdrop-blur-md ${isDarkMode ? 'bg-white/95 border border-subtle/60 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.4),0_10px_10px_-5px_var(--brand-primary-opacity-10)]' : 'bg-white/95 border border-subtle/60 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_var(--brand-primary-opacity-06)]'}`}>
                  {/* User Info Section */}
                  <div className={`px-4 py-3 border-b ${'border-subtle/60 bg-gradient-to-r from-surface-2/50 to-transparent'}`}>
                    <p className={`text-sm font-bold ${'text-ink'}`}>
                      {user?.userData.firstName} {user?.userData.lastName}
                    </p>
                    <p className={`text-xs mt-0.5 truncate ${'text-ink-muted'}`}>
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    {/* Profile */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        router.push(getProfilePath());
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm relative transition-all duration-200 group ${'text-ink hover:bg-surface-2/50'} rounded-lg mx-1`}
                    >
                      <User className={`w-4 h-4 transition-colors ${'group-hover:text-primary'}`} />
                      <span className="flex-1 text-left font-medium">Profile</span>
                      <div className={`absolute right-0 top-0 bottom-0 w-1 rounded-l-full transition-opacity duration-200 ${'bg-primary'} opacity-0 group-hover:opacity-100`}></div>
                    </button>

                    {/* Settings - Hide for super_admin */}
                    {role !== 'super_admin' && (
                      <>
                    {/* Divider */}
                        <div className={`h-px my-1 mx-2 ${'bg-surface-2/60'}`} />

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                            if (role === 'admin') router.push('/admin/settings');
                            if (role === 'faculty') router.push('/faculty/settings');
                            if (role === 'student') router.push('/student/settings');
                      }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm relative transition-all duration-200 group ${'text-ink hover:bg-surface-2/50'} rounded-lg mx-1`}
                        >
                          <Settings className={`w-4 h-4 transition-colors ${'group-hover:text-primary'}`} />
                          <span className="flex-1 text-left font-medium">Settings</span>
                          <div className={`absolute right-0 top-0 bottom-0 w-1 rounded-l-full transition-opacity duration-200 ${'bg-primary'} opacity-0 group-hover:opacity-100`}></div>
                    </button>

                    {/* Divider */}
                        <div className={`h-px my-1 mx-2 ${'bg-surface-2/60'}`} />
                      </>
                    )}

                    {/* Divider for super_admin (only if Settings is hidden) */}
                    {role === 'super_admin' && (
                      <div className={`h-px my-1 mx-2 ${'bg-surface-2/60'}`} />
                    )}

                    {/* Log out */}
                    <button
                      onClick={() => setShowLogoutDialog(true)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm relative transition-all duration-200 group ${'text-ink hover:bg-bad-wash hover:text-bad'} rounded-lg mx-1`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="flex-1 text-left font-medium">Log out</span>
                      <div className="absolute right-0 top-0 bottom-0 w-1 rounded-l-full transition-opacity duration-200 bg-bad opacity-0 group-hover:opacity-100"></div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content - Enhanced Design with Theme Classes */}
        <main className={`p-6 min-h-[calc(100vh-112px)] transition-colors duration-200 ${isDarkMode ? 'bg-gradient-to-br from-ink via-ink to-ink/30' : 'bg-gradient-to-br from-surface-2 via-white to-surface-2/50'} ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_50%,var(--brand-primary-opacity-06),transparent_50%),radial-gradient(circle_at_80%_80%,var(--brand-primary-opacity-06),transparent_50%)]' : 'bg-[radial-gradient(circle_at_20%_50%,var(--brand-primary-opacity-06),transparent_50%),radial-gradient(circle_at_80%_80%,var(--brand-primary-opacity-06),transparent_50%)]'}`}>
          {children}
        </main>

        {/* Full Page Footer - Fixed at Bottom */}
        <footer className={`h-12 flex items-center justify-center px-4 lg:px-6 sticky bottom-0 z-40 backdrop-blur-md ${isDarkMode ? 'bg-gradient-to-r from-ink/98 via-ink/95 to-ink/98 border-t border-subtle/60 shadow-[0_-4px_20px_rgba(0,0,0,0.3),0_-2px_8px_var(--brand-primary-opacity-10)]' : 'bg-gradient-to-r from-white/98 via-white/95 to-white/98 border-t border-subtle/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08),0_-2px_8px_var(--brand-primary-opacity-06)]'} transition-all duration-200`}>
          <p className={`text-xs font-medium ${'text-ink-muted'}`}>
            © {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.
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
                color: 'var(--text-primary)',
                borderColor: 'var(--border-color)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--black-opacity-05)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="text-white"
              style={{
                backgroundColor: 'var(--error)',
                color: 'var(--white)',
                borderColor: 'var(--error)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--error-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--error)';
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
