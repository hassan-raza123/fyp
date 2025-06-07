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
  Shield,
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
  Link,
  LayoutDashboard,
  UserCog,
} from 'lucide-react';
import { LucideProps } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';

interface SidebarNavLinkProps {
  item: {
    id: string;
    label: string;
    icon: React.ForwardRefExoticComponent<
      Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
    >;
    badge?: number;
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
        w-full flex items-center px-4 py-2.5 rounded-lg
        transition-all duration-300 ease-in-out
        ${
          isActive
            ? 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-primary shadow-sm relative'
            : isDarkMode
            ? 'text-gray-400 hover:bg-purple-500/10 hover:text-primary hover:translate-x-1'
            : 'text-gray-600 hover:bg-purple-500/10 hover:text-primary hover:translate-x-1'
        }
        ${isChild ? 'pl-8' : ''}
        group
      `}
    >
      <div className='relative flex items-center'>
        <div
          className={`
          p-2 rounded-lg transition-all duration-300
          ${
            isActive
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md'
              : 'text-current group-hover:scale-110'
          }
        `}
        >
          <item.icon
            className={`flex-shrink-0 ${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'}`}
          />
        </div>
        {isActive && (
          <div className='absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg' />
        )}
      </div>
      {isSidebarOpen && (
        <span
          className={`ml-3 text-sm font-medium transition-all duration-300 ${
            isActive ? 'font-semibold' : ''
          }`}
        >
          {item.label}
        </span>
      )}
      {item.badge && isSidebarOpen && (
        <span
          className={`
            ml-auto px-2 py-0.5 text-xs font-medium rounded-full
            ${
              isActive
                ? 'bg-white text-primary shadow-sm'
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm'
            }
          `}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
};

const navigationSections = [
  {
    title: 'DASHBOARD',
    items: [
      { id: 'overview', label: 'Overview', icon: Home, href: '/admin' },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart2,
        href: '/admin/analytics',
      },
    ],
  },
  {
    title: 'STUDENT MANAGEMENT',
    items: [
      {
        id: 'students',
        label: 'Students',
        icon: Users,
        href: '/admin/students',
      },
      // {
      //   id: 'attendance',
      //   label: 'Attendance',
      //   icon: Calendar,
      //   href: '/admin/attendance',
      // },
      { id: 'batches', label: 'Batches', icon: Layers, href: '/admin/batches' },
      // {
      //   id: 'sessions',
      //   label: 'Sessions',
      //   icon: Calendar,
      //   href: '/admin/sessions',
      // },
    ],
  },
  {
    title: 'ACADEMIC STRUCTURE',
    items: [
      {
        id: 'departments',
        label: 'Departments',
        icon: Building2,
        href: '/admin/departments',
      },
      {
        id: 'programs',
        label: 'Programs',
        icon: GraduationCap,
        href: '/admin/programs',
      },
      {
        id: 'courses',
        label: 'Courses',
        icon: BookOpen,
        href: '/admin/courses',
      },
      {
        id: 'course-offerings',
        label: 'Course Offerings',
        icon: BookCheck,
        href: '/admin/course-offerings',
      },
      {
        id: 'semesters',
        label: 'Semesters',
        icon: Calendar,
        href: '/admin/semesters',
      },
      {
        id: 'sections',
        label: 'Sections',
        icon: Users,
        href: '/admin/sections',
      },
    ],
  },
  {
    title: 'LEARNING OUTCOMES',
    items: [
      { id: 'plos', label: 'PLOs', icon: Target, href: '/admin/plos' },
      { id: 'clos', label: 'CLOs', icon: FileText, href: '/admin/clos' },
      {
        id: 'clo-plo-mappings',
        label: 'CLO-PLO Mappings',
        icon: Link,
        href: '/admin/clo-plo-mappings',
      },
    ],
  },
  {
    title: 'ASSESSMENT & RESULTS',
    items: [
      {
        id: 'assessments',
        label: 'Assessments',
        icon: FileText,
        href: '/admin/assessments',
      },
      {
        id: 'results',
        label: 'Results',
        icon: BarChart2,
        href: '/admin/results',
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'users', label: 'Users', icon: Users, href: '/admin/users' },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings2,
        href: '/admin/settings',
      },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Core States
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

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
    const pathSegments = pathname.split('/');
    // Get the base path (e.g., 'batches' from '/admin/batches/cmbf08ds800038tugw9lz6p40')
    const basePath = pathSegments[2] || ''; // Index 2 because pathname starts with '/admin/'

    // Find the matching navigation item
    const findActiveTab = () => {
      for (const section of navigationSections) {
        const matchingItem = section.items.find((item) => {
          // Get the base path from the item's href (e.g., 'batches' from '/admin/batches')
          const itemBasePath = item.href?.split('/')[2];
          return (
            itemBasePath === basePath ||
            (basePath === '' && item.id === 'overview')
          );
        });
        if (matchingItem) {
          return matchingItem.id;
        }
      }
      return 'overview'; // Default to overview if no match found
    };

    setActiveTab(findActiveTab());
  }, [pathname]); // Update when pathname changes

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

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'
      }`}
    >
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-40'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 h-full
        transition-all duration-300 ease-in-out
        ${
          isDarkMode
            ? 'bg-gray-800/95 backdrop-blur-md border-gray-700'
            : 'bg-white/95 backdrop-blur-md border-gray-200'
        }
        border-r shadow-lg
        ${isSidebarOpen ? 'w-72' : 'w-20'}
        ${!isSidebarOpen && 'lg:w-20'}
        ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }
        z-50
      `}
      >
        {/* Sidebar Header */}
        <div
          className={`
          h-16 flex items-center justify-between px-4
          ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
          border-b
        `}
        >
          <div className='flex items-center space-x-3'>
            <div
              className={`flex-shrink-0 ${
                isSidebarOpen ? 'w-12 h-12' : 'w-8 h-8'
              } rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 hover:opacity-90 hover:-translate-y-0.5 flex items-center justify-center shadow-lg transition-all duration-300`}
            >
              <Shield
                className={`${
                  isSidebarOpen ? 'w-7 h-7' : 'w-5 h-5'
                } text-white transition-transform duration-300 hover:scale-110`}
              />
            </div>

            {isSidebarOpen && (
              <div className='flex flex-col'>
                <h1
                  className={`font-bold text-lg tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  Admin Panel
                </h1>
                <div className='flex items-center space-x-1'>
                  <span
                    className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    v2.0.1
                  </span>
                  <span className='px-1.5 py-0.5 text-[10px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full shadow-sm'>
                    Beta
                  </span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={`
              p-1 rounded-lg transition-all duration-300 hover:scale-110
              ${
                isDarkMode
                  ? 'hover:bg-purple-500/10 text-gray-400 hover:text-primary'
                  : 'hover:bg-purple-500/10 text-gray-600 hover:text-primary'
              }
            `}
          >
            {isSidebarOpen ? (
              <ChevronLeft size={22} />
            ) : (
              <ChevronRight size={21} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className='p-4 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent'>
          {navigationSections.map((section, idx) => (
            <div key={idx} className='mb-8'>
              {isSidebarOpen && (
                <h2
                  className={`
                  px-4 mb-3 text-xs font-semibold uppercase tracking-wider
                  ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                `}
                >
                  {section.title}
                </h2>
              )}
              <div className='space-y-1'>
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

        {/* User Profile */}
        <div
          ref={profileRef}
          className={`
          absolute bottom-0 left-0 right-0 p-4
          ${
            isDarkMode
              ? 'border-gray-700 bg-gray-800/50'
              : 'border-gray-200 bg-gray-50/50'
          }
          border-t backdrop-blur-sm
        `}
        >
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`
              w-full flex items-center space-x-3 p-2 rounded-lg
              transition-all duration-300
              ${
                isDarkMode
                  ? 'hover:bg-purple-500/10 text-gray-400 hover:text-primary'
                  : 'hover:bg-purple-500/10 text-gray-600 hover:text-primary'
              }
            `}
          >
            <div className='flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm transition-transform duration-300 hover:scale-110'>
              <User className='w-4 h-4 text-white' />
            </div>
            {isSidebarOpen && (
              <div className='flex-1 min-w-0'>
                <p
                  className={`text-sm font-medium truncate ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Admin User
                </p>
                <p
                  className={`text-xs truncate ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  admin@example.com
                </p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`
        transition-all duration-300
        ${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}
        ml-0
      `}
      >
        {/* Enhanced Header */}
        <header
          className={`
          h-16 flex items-center justify-between px-4 lg:px-12 sticky top-0 z-40
          ${
            isDarkMode
              ? 'bg-gray-800/95 border-gray-700'
              : 'bg-white/95 border-gray-200'
          }
          border-b backdrop-blur-md shadow-sm
        `}
        >
          {/* Mobile Menu Button */}
          <button
            className='lg:hidden mr-4 p-2 rounded-lg hover:bg-purple-500/10 text-gray-600 hover:text-primary transition-all duration-300'
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className='flex items-center flex-1 min-w-0'>
            {/* Search Bar */}
            <div
              ref={searchRef}
              className={`
              relative flex-1 max-w-2xl
              ${isMobileSearchOpen ? 'block' : 'hidden lg:block'}
            `}
            >
              <div className='relative'>
                <Search
                  className={`
                  absolute left-3 top-1/2 -translate-y-1/2
                  ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                `}
                  size={18}
                />
                <input
                  type='text'
                  placeholder='Search...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`
                  w-full pl-10 pr-4 py-2 rounded-lg
                  ${
                    isDarkMode
                      ? 'bg-gray-700 text-white placeholder-gray-400'
                      : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-purple-500
                  transition-all duration-300
                  shadow-sm
                `}
                />
              </div>
            </div>
          </div>

          <div className='flex items-center space-x-4'>
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!isDarkMode)}
              className={`
                p-2 rounded-lg
                ${
                  isDarkMode
                    ? 'hover:bg-purple-500/10 text-gray-400 hover:text-primary'
                    : 'hover:bg-purple-500/10 text-gray-600 hover:text-primary'
                }
                transition-all duration-300 hover:scale-110
              `}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notifications */}
            <div ref={notificationRef} className='relative'>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`
                  p-2 rounded-lg
                  ${
                    isDarkMode
                      ? 'hover:bg-purple-500/10 text-gray-400 hover:text-primary'
                      : 'hover:bg-purple-500/10 text-gray-600 hover:text-primary'
                  }
                  transition-all duration-300 hover:scale-110
                `}
              >
                <Bell size={20} />
              </button>
            </div>

            {/* Profile Menu */}
            <div ref={profileRef} className='relative'>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`
                  p-2 rounded-lg
                  ${
                    isDarkMode
                      ? 'hover:bg-purple-500/10 text-gray-400 hover:text-primary'
                      : 'hover:bg-purple-500/10 text-gray-600 hover:text-primary'
                  }
                  transition-all duration-300 hover:scale-110
                `}
              >
                <User size={20} />
              </button>

              {/* Profile Menu Dropdown */}
              {showProfileMenu && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  } ring-1 ring-black ring-opacity-5 z-50 transform transition-all duration-300 origin-top-right`}
                >
                  <div className='py-1'>
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center px-4 py-2 text-sm ${
                        isDarkMode
                          ? 'text-gray-300 hover:bg-purple-500/10 hover:text-primary'
                          : 'text-gray-700 hover:bg-purple-500/10 hover:text-primary'
                      } transition-all duration-300`}
                    >
                      <LogOut className='w-4 h-4 mr-3' />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className='p-6'>{children}</main>
      </div>
    </div>
  );
}
