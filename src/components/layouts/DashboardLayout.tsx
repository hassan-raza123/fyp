import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  Search,
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
  Shield,
  Sun,
  Moon,
  GraduationCap,
  UserCheck,
  Building2,
} from 'lucide-react';

interface SidebarNavLinkProps {
  item: {
    id: string;
    label: string;
    icon: React.ForwardRefExoticComponent<any>;
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
  const isActive = activeTab === item.id;
  return (
    <button
      onClick={() => setActiveTab(item.id)}
      className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
        isActive
          ? isDarkMode
            ? 'bg-gray-700 text-white'
            : 'bg-gray-100 text-gray-900'
          : isDarkMode
          ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${isChild ? 'pl-8' : ''}`}
    >
      <item.icon
        className={`flex-shrink-0 ${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'}`}
      />
      {isSidebarOpen && (
        <span className='ml-3 text-sm font-medium'>{item.label}</span>
      )}
      {item.badge && isSidebarOpen && (
        <span
          className={`ml-auto px-2 py-0.5 text-xs font-medium rounded-full ${
            isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
          }`}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
};

const navigationSections = [
  {
    title: 'MAIN',
    items: [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'students', label: 'Students', icon: Users, badge: 0 },
      { id: 'attendance', label: 'Attendance', icon: Calendar, badge: 0 },
    ],
  },
  {
    title: 'ACADEMIC',
    items: [
      {
        id: 'programs',
        label: 'Programs',
        icon: GraduationCap,
        href: '/admin/programs',
      },
      {
        id: 'departments',
        label: 'Departments',
        icon: Building2,
        href: '/admin/departments',
      },
      {
        id: 'courses',
        label: 'Courses',
        icon: BookOpen,
        href: '/admin/courses',
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
    title: 'MANAGEMENT',
    items: [
      { id: 'users', label: 'Users', icon: Users, badge: 0 },
      { id: 'analytics', label: 'Analytics', icon: BarChart2, badge: 0 },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'
      }`}
    >
      {isSidebarOpen && (
        <div
          className='fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-40'
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full transition-all duration-300 ease-in-out ${
          isDarkMode
            ? 'bg-gray-800/95 backdrop-blur-md border-gray-700'
            : 'bg-white/95 backdrop-blur-md border-gray-200'
        } border-r ${isSidebarOpen ? 'w-72' : 'w-20'} ${
          !isSidebarOpen && 'lg:w-20'
        } ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } z-50`}
      >
        <div
          className={`h-16 flex items-center justify-between px-4 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          } border-b`}
        >
          <div className='flex items-center space-x-3'>
            <div
              className={`flex-shrink-0 ${
                isSidebarOpen ? 'w-12 h-12' : 'w-8 h-8'
              } rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center`}
            >
              <Shield
                className={`${
                  isSidebarOpen ? 'w-7 h-7' : 'w-5 h-5'
                } text-white`}
              />
            </div>
            {isSidebarOpen && (
              <div className='flex flex-col'>
                <h1
                  className={`font-bold text-lg ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  Dashboard Pro
                </h1>
                <span className='text-xs text-gray-500'>v2.0.1</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {isSidebarOpen ? (
              <ChevronLeft size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>
        <nav className='p-4'>
          {navigationSections.map((section, idx) => (
            <div key={idx} className='mb-8'>
              {isSidebarOpen && (
                <h2
                  className={`px-4 mb-3 text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-400' : 'text-text-light'
                  }`}
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
        <div
          ref={profileRef}
          className={`absolute bottom-0 left-0 right-0 p-4 ${
            isDarkMode
              ? 'border-gray-700 bg-gray-800/50'
              : 'border-gray-200 bg-gray-50/50'
          } border-t backdrop-blur-sm`}
        >
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className='flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center'>
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
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-72' : 'lg:ml-20'
        } ml-0`}
      >
        <header
          className={`h-16 flex items-center justify-between px-4 lg:px-12 sticky top-0 z-40 ${
            isDarkMode
              ? 'bg-gray-800/95 border-gray-700'
              : 'bg-white/95 border-gray-200'
          } border-b backdrop-blur-md`}
        >
          <button
            className='lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700'
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className='flex items-center flex-1 min-w-0'>
            <div
              ref={searchRef}
              className={`relative flex-1 max-w-2xl ${
                isMobileSearchOpen ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className='relative'>
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                  size={18}
                />
                <input
                  type='text'
                  placeholder='Search anything...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 text-white placeholder-gray-400'
                      : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200`}
                />
              </div>
            </div>
          </div>
          <div className='flex items-center space-x-4'>
            <button
              onClick={() => setDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              } transition-all duration-200`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className={`p-2 rounded-lg ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              } transition-all duration-200`}
            >
              <Bell size={20} />
            </button>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`p-2 rounded-lg ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              } transition-all duration-200`}
            >
              <User size={20} />
            </button>
          </div>
        </header>
        <main className='p-6'>{children}</main>
      </div>
    </div>
  );
}
