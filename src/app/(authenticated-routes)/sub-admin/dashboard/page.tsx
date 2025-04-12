'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
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
  MessagesSquare,
  Layers,
  GraduationCap,
  BellRing,
  UserCheck,
  Zap,
  Clock,
  AlertCircle,
  Check,
  X,
  MoreVertical,
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
  Info,
} from 'lucide-react';
import { MiniStatsCardProps, ProgressBarProps, TimelineProps } from '@/app/types/dashboard';

const ModernDashboard = () => {
  // Core States
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeView, setActiveView] = useState('grid');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Refs for click outside
  const searchRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
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

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        console.log('Searching for:', searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Loading simulation for period change
  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  }, [selectedPeriod]);

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'alert',
      message: 'System maintenance scheduled for tonight',
      time: '5 mins ago',
      icon: AlertCircle,
      color: 'text-yellow-500',
      read: false,
    },
    {
      id: 2,
      type: 'success',
      message: 'Monthly reports have been generated',
      time: '10 mins ago',
      icon: Check,
      color: 'text-green-500',
      read: false,
    },
    {
      id: 3,
      type: 'info',
      message: 'New course materials are available',
      time: '15 mins ago',
      icon: BookOpen,
      color: 'text-primary',
      read: false,
    },
  ]);

  // Navigation Sections
  const navigationSections = [
    {
      title: 'Main',
      items: [
        { id: 'overview', icon: Home, label: 'Overview', badge: 0 },
        { id: 'students', icon: Users, label: 'Students', badge: 3 },
        { id: 'attendance', icon: Calendar, label: 'Attendance', badge: 0 },
      ],
    },
    {
      title: 'Academic',
      items: [
        { id: 'courses', icon: BookOpen, label: 'Courses', badge: 2 },
        { id: 'grades', icon: GraduationCap, label: 'Grades', badge: 0 },
        { id: 'departments', icon: Layers, label: 'Departments', badge: 0 },
      ],
    },
    {
      title: 'Management',
      items: [
        { id: 'analytics', icon: BarChart2, label: 'Analytics', badge: 0 },
        { id: 'reports', icon: FileText, label: 'Reports', badge: 5 },
        { id: 'settings', icon: Settings2, label: 'Settings', badge: 0 },
      ],
    },
  ];

  // Quick Stats
  const quickStats = [
    {
      title: 'Total Students',
      value: '3,845',
      change: '+12%',
      trend: [30, 40, 35, 50, 49, 60, 70, 91, 86],
      icon: Users,
      color: 'from-blue-500 via-blue-400 to-blue-300',
      detail: '156 new this month',
    },
    {
      title: 'Attendance Rate',
      value: '95.2%',
      change: '+4.3%',
      trend: [80, 85, 90, 88, 87, 92, 95, 94, 95],
      icon: UserCheck,
      color: 'from-green-500 via-green-400 to-green-300',
      detail: '2.1% above target',
    },
    {
      title: 'Course Completion',
      value: '142',
      change: '+8',
      trend: [20, 25, 30, 35, 25, 40, 45, 50, 55],
      icon: BookCheck,
      color: 'from-purple-500 via-purple-400 to-purple-300',
      detail: '12 courses added',
    },
    {
      title: 'Overall Performance',
      value: '88%',
      change: '+2.5%',
      trend: [75, 78, 80, 82, 79, 85, 86, 87, 88],
      icon: Award,
      color: 'from-orange-500 via-orange-400 to-orange-300',
      detail: 'Top 10% nationally',
    },
  ];

  // Performance Goals
  const performanceGoals = [
    {
      title: 'Attendance Target',
      current: 95,
      target: 98,
      icon: Target,
      color: 'blue',
      status: 'On Track',
    },
    {
      title: 'Course Completion Rate',
      current: 88,
      target: 95,
      icon: Goal,
      color: 'green',
      status: 'Behind',
    },
    {
      title: 'Student Satisfaction',
      current: 92,
      target: 95,
      icon: Star,
      color: 'yellow',
      status: 'On Track',
    },
  ];

  // Chart Data
  const performanceData = [
    { month: 'Jan', students: 85, attendance: 92 },
    { month: 'Feb', students: 88, attendance: 87 },
    { month: 'Mar', students: 92, attendance: 94 },
    { month: 'Apr', students: 86, attendance: 89 },
    { month: 'May', students: 89, attendance: 91 },
    { month: 'Jun', students: 94, attendance: 93 },
  ];

  // Recent Activities
  const recentActivities = [
    {
      id: 1,
      user: 'Sarah Johnson',
      action: 'Submitted Assignment',
      course: 'Web Development',
      time: '2 minutes ago',
      status: 'Completed',
      avatar: '/api/placeholder/32/32',
    },
    {
      id: 2,
      user: 'Michael Chen',
      action: 'Joined Live Session',
      course: 'Data Structures',
      time: '10 minutes ago',
      status: 'Active',
      avatar: '/api/placeholder/32/32',
    },
    {
      id: 3,
      user: 'Emma Davis',
      action: 'Started Quiz',
      course: 'Machine Learning',
      time: '15 minutes ago',
      status: 'In Progress',
      avatar: '/api/placeholder/32/32',
    },
    {
      id: 4,
      user: 'James Wilson',
      action: 'Updated Profile',
      course: 'Software Engineering',
      time: '30 minutes ago',
      status: 'Completed',
      avatar: '/api/placeholder/32/32',
    },
  ];

  // Timeline Component
  const timelineItems = [
    {
      title: 'System Update',
      description: 'New features deployed successfully',
      time: '09:00 AM',
      date: 'Today',
      icon: Check,
      color: 'bg-green-500',
    },
    {
      title: 'Database Backup',
      description: 'Automatic backup completed',
      time: '03:00 AM',
      date: 'Today',
      icon: Shield,
      color: 'bg-blue-500',
    },
    {
      title: 'User Reports',
      description: 'Monthly user reports generated',
      time: '11:30 PM',
      date: 'Yesterday',
      icon: FileText,
      color: 'bg-purple-500',
    },
  ];

  // Components
  const SidebarNavLink = ({ item, isChild = false }:any) => (
    <button
      onClick={() => setActiveTab(item.id)}
      className={`
        w-full flex items-center px-4 py-3 rounded-xl font-semibold transition-all duration-200
        ${isSidebarOpen ? 'justify-start' : 'justify-center'}
        ${isChild ? 'ml-4' : ''}
        ${
          activeTab === item.id
            ? isDarkMode
              ? 'bg-purple-600/20 text-primary'
              : 'bg-purple-50 text-primary'
            : isDarkMode
            ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
            : 'text-text-light hover:bg-gray-50'
        }
        group
      `}
    >
      <div className='relative flex items-center'>
        <div
          className={`
          p-2 rounded-lg transition-all duration-200 group-hover:scale-110
          ${
            activeTab === item.id
              ? isDarkMode
                ? 'bg-purple-600/10 text-primary'
                : 'bg-purple-100 text-primary'
              : 'text-current'
          }
        `}
        >
          <item.icon size={22} />
        </div>
        {item.badge > 0 && (
          <span className={`absolute -top-1 ${isSidebarOpen ? 'left-5' : '-right-1'} w-5 h-5 bg-red-500 text-accent text-[11px] rounded-full flex items-center justify-center`}>
            {item.badge}
          </span>
        )}
        {isSidebarOpen && (
          <span className='ml-3 font-medium text-sm'>{item.label}</span>
        )}
      </div>
    </button>
  );
  
  const MiniStatsCard: React.FC<MiniStatsCardProps> = ({ stat }) => (
    <div
      className={`
      relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.color}
      transition-all duration-200 hover:transform hover:scale-[1.02]
      hover:shadow-lg cursor-pointer
    `}
    >
      <div className='px-6 py-5 text-white'>
        <div className='flex justify-between items-start'>
          <div className='space-y-2'>
            <p className='text-white font-medium text-sm'>{stat.title}</p>
            <h3 className='text-3xl font-bold'>{stat.value}</h3>
            <p className='text-sm text-white/80'>{stat.detail}</p>
          </div>
          <div className='bg-white/10 p-2 rounded-lg'>
            <stat.icon size={24} className='text-white' />
          </div>
        </div>
        <div className='mt-4'>
          <ResponsiveContainer width='100%' height={32}>
            <AreaChart data={stat.trend.map((value, i) => ({ value }))}>
              <Area
                type='monotone'
                dataKey='value'
                stroke='rgba(255,255,255,0.8)'
                fill='rgba(255,255,255,0.2)'
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className='flex items-center mt-2 text-sm'>
          <TrendingUp size={14} className='mr-1' />
          <span>{stat.change} from last month</span>
        </div>
      </div>
    </div>
  );

  
  const ProgressBar: React.FC<ProgressBarProps> = ({ current, target, color }) => {
    const getColorClasses = (color: ProgressBarProps['color']) => {
      const backgrounds: Record<ProgressBarProps['color'], { bg: string, bgLight: string }> = {
        blue: { 
          bg: 'bg-blue-300', 
          bgLight: 'bg-blue-100' 
        },
        green: { 
          bg: 'bg-green-300', 
          bgLight: 'bg-green-100' 
        },
        yellow: { 
          bg: 'bg-yellow-300', 
          bgLight: 'bg-yellow-100' 
        },
        red: { 
          bg: 'bg-red-300', 
          bgLight: 'bg-red-100' 
        },
        purple: { 
          bg: 'bg-purple-300', 
          bgLight: 'bg-purple-100' 
        }
      };
      return backgrounds[color];
    };
  
    const { bg, bgLight } = getColorClasses(color);
    
    return (
      <div className={`w-full ${bgLight} rounded-full h-2`}>
        <div
          className={`h-2 rounded-full ${bg} transition-all duration-300`}
          style={{ width: `${Math.min((current / target) * 100, 100)}%` }}
        />
      </div>
    );
  };
  
    const Timeline: React.FC<TimelineProps> = ({ items }) => (
    <div className='relative'>
      {items.map((item, index) => (
        <div key={index} className='ml-6 mb-6 relative'>
          <div
            className={`
            absolute -left-9 mt-1.5 w-5 h-5 rounded-full border-4
            ${isDarkMode ? 'border-gray-800' : 'border-white'}
            ${item.color} flex items-center justify-center
          `}
          >
            <item.icon size={12} className='text-white' />
          </div>
          <div className='flex flex-col'>
            <span className='text-sm text-gray-500 dark:text-gray-400'>
              {item.date} - {item.time}
            </span>
            <h4
              className={`text-md font-medium mt-1 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}
            >
              {item.title}
            </h4>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
        border-r
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
  } rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 hover:opacity-90 hover:-translate-y-0.5 flex items-center justify-center shadow-lg`}
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
                  className={`font-bold text-lg tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  Dashboard Pro
                </h1>
                <div className='flex items-center space-x-1'>
                  <span
                    className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    v2.0.1
                  </span>
                  <span className='px-1.5 py-0.5 text-[10px]  bg-purple-100 text-primary rounded-full'>
                    Beta
                  </span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={`
              p-1 rounded-lg transition-all duration-200 hover:scale-110
              ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
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
        <nav className='p-4'>
          {navigationSections.map((section, idx) => (
            <div key={idx} className='mb-8'>
              {isSidebarOpen && (
                <h2
                  className={`
                  px-4 mb-3 text-xs font-semibold uppercase tracking-wider
                  ${isDarkMode ? 'text-gray-400' : 'text-text-light'}
                `}
                >
                  {section.title}
                </h2>
              )}
              <div className='space-y-1'>
                {section.items.map((item) => (
                  <SidebarNavLink key={item.id} item={item} />
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
              w-full flex items-center space-x-4 p-2 rounded-xl transition-all duration-200
              ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
              ${!isSidebarOpen && 'justify-center'}
            `}
          >
            <div className='relative flex-shrink-0'>
              <img
                src='/api/placeholder/40/40'
                alt='Profile'
                className='w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-gray-800'
              />
              <span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800'></span>
            </div>
            {isSidebarOpen && (
              <div className='flex-1 text-left min-w-0'>
                <p
                  className={`text-sm  font-medium truncate ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
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
            {isSidebarOpen && (
              <ChevronRight
                size={18}
                className={`
                transform transition-transform duration-200
                ${showProfileMenu ? 'rotate-90' : ''}
                ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
              `}
              />
            )}
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && isSidebarOpen && (
            <div
              className={`
              absolute bottom-full left-2 right-2 mb-2 py-2 rounded-xl shadow-lg
              ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }
              border
            `}
            >
              <div className='px-4 py-2'>
                <div className='flex items-center justify-between'>
                  <span
                    className={`text-xs font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Signed in as
                  </span>
                  <span className='px-2 py-0.5 text-xs font-medium bg-purple-100 text-primary rounded-full'>
                    Admin
                  </span>
                </div>
                <p
                  className={`mt-1 text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  admin@example.com
                </p>
              </div>
              <div
                className={`my-2 border-t ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
              />
              <button
                className={`
                w-full px-4 py-2 text-left text-sm transition-colors
                ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-50 text-gray-700'
                }
              `}
              >
                <User size={16} className='inline-block mr-2' />
                View Profile
              </button>
              <button
                className={`
                w-full px-4 py-2 text-left text-sm transition-colors
                ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-50 text-gray-700'
                }
              `}
              >
                <Settings size={16} className='inline-block mr-2' />
                Settings
              </button>
              <div
                className={`my-2 border-t ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
              />
              <button className='w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors'>
                <LogOut size={16} className='inline-block mr-2' />
                Sign Out
              </button>
            </div>
          )}
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
          border-b backdrop-blur-md
        `}
        >
          {/* Mobile Menu Button */}
          <button
            className='lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700'
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className='flex items-center flex-1 min-w-0'>
        {/* Search Bar */}
        <div className='relative w-full max-w-md mx-auto lg:mx-0 lg:max-w-lg hidden sm:block' ref={searchRef}>
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
            <Search size={20} />
          </div>
          <input
            type='text'
            placeholder='Search anything...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`
              w-full pl-10 pr-4 py-2 rounded-xl
              ${isDarkMode 
                ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-500'}
              border focus:outline-none focus:ring-2 focus:ring-blue-500/20
              transition-all duration-200
            `}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={`absolute inset-y-0 right-0 pr-3 flex items-center ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

          {/* Header Actions */}
          <div className='flex items-center'>

          <button className="sm:hidden p-2 rounded-xl mr-2"  onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}>
          <Search size={22} />
        </button>

        {isMobileSearchOpen && (
        <div 
          ref={searchRef}
          className={`
            fixed top-0 left-0 w-full z-50 p-4 transition-all duration-300 ease-in-out
            ${isDarkMode 
              ? 'bg-gray-800 text-white' 
              : 'bg-white text-gray-900'}
          `}
          style={{ 
            transform: isMobileSearchOpen ? 'translateY(0)' : 'translateY(-100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <div className='relative'>
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
              <Search size={20} />
            </div>
            <input
              type='text'
              placeholder='Search anything...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2 rounded-xl
                ${isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-500'}
                border focus:outline-none focus:ring-2 focus:ring-blue-500/20
                transition-all duration-200
              `}
            />
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className={`absolute inset-y-0 right-0 pr-3 flex items-center ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
            {/* Notifications */}
            <div className='relative' ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`
                  p-2 rounded-xl relative transition-colors
                  ${
                    isDarkMode
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <Bell size={22} />
                {notifications.some((n) => !n.read) && (
                  <span className='absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800'></span>
                )}
              </button>

              {/* Notifications Panel */}
              {showNotifications && (
        <div
          className={`
            fixed sm:absolute right-0 sm:mt-5 mt-0
            w-full sm:w-96
            h-[100vh] sm:h-auto
            top-0 sm:top-full
            rounded-none sm:rounded-xl shadow-lg
            z-50
            ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            border transform origin-top
            transition-all duration-200 ease-out
          `}
        >
          {/* Header */}
          <div className='sticky top-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-inherit'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center space-x-2'>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className='sm:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700'
                >
                  <span className='sr-only'>Close</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Notifications
                </h3>
              </div>
              <div className='flex space-x-2'>
                <button
                  onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                  className='text-sm text-primary hover:text-primary-light'
                >
                  Mark all as read
                </button>
                <div className={`h-4 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <button
                  onClick={() => setNotifications([])}
                  className='text-sm text-red-600 hover:text-red-700 dark:text-red-400'
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>

          {/* Notification List */}
          <div className='max-h-[calc(100vh-80px)] sm:max-h-[400px] overflow-y-auto'>
            {notifications.length === 0 ? (
              <div className='p-8 text-center'>
                <div className='mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4'>
                  <Bell size={24} className='text-gray-500 dark:text-gray-400' />
                </div>
                <p className='text-gray-500 dark:text-gray-400'>
                  No new notifications
                </p>
              </div>
            ) : (
              <div className='p-2'>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      p-3 rounded-lg mb-2 cursor-pointer
                      transition-all duration-200
                      ${!notification.read && 'bg-purple-50 dark:bg-purple-900/20'}
                      hover:bg-gray-50 dark:hover:bg-gray-700
                    `}
                  >
                    <div className='flex items-start'>
                      <div
                        className={`
                          p-2 rounded-lg
                          ${notification.type === 'alert'
                            ? 'bg-yellow-100'
                            : notification.type === 'success'
                            ? 'bg-green-100'
                            : 'bg-purple-100'
                          }
                        `}
                      >
                        <notification.icon
                          size={18}
                          className={notification.color}
                        />
                      </div>
                      <div className='ml-3 flex-1'>
                        <p className={`text-sm font-medium mb-0.5 ${isDarkMode ? 'text-text-light' : 'text-gray-900'}`}>
                          {notification.message}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {notification.time}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className='w-2 h-2 bg-gradient-to-br from-primary via-primary-light to-primary rounded-full mt-2'></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
            
            </div>

            {/* Quick Actions */}
            <div className='flex items-center space-x-2'>
              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!isDarkMode)}
                className={`
                  p-2 rounded-xl transition-all duration-200 hover:scale-110
                  ${
                    isDarkMode
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
              </button>

              {/* Help */}
              <button
                className={`
                p-2 rounded-xl transition-all duration-200 hover:scale-110
                ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }
              `}
              >
                <HelpCircle size={22} />
              </button>

              {/* Settings */}
              <button
                className={`
                p-2 rounded-xl transition-all duration-200 hover:scale-110
                ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }
              `}
              >
                <Settings size={22} />
              </button>

              <div
                className={`h-8 w-px mx-2 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />

              {/* Profile Menu */}
              <div className='relative'>
                <button
                  className='
                  flex items-center space-x-2 px-2 sm:px-4 py-2 rounded-lg
                  bg-gradient-to-br from-purple-500 to-indigo-600 hover:-translate-y-0.5 text-accent
                  transition-all duration-200
                '
                >
                  <LogOut size={18} />
                  <span className='text-sm font-medium hidden sm:block'>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className='p-12 sm:space-y-6 space-y-4'>
          {/* Page Header */}
          <div className='flex flex-col sm:flex-row justify-between  mb-6 space-y-4'>
              <div>
              <h1
                className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}
              >
                Dashboard Overview
              </h1>
              <p
                className={`mt-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Welcome back, here's what's happening today
              </p>
            </div>

            {/* Page Actions */}
            
            <div className='flex items-center flex-wrap w-full md:w-auto gap-2'>
              {/* Period Selector */}
              <div
                className={`
                flex rounded-xl overflow-hidden border
                ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
              `}
              >
                {['day', 'week', 'month', 'year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`
                      px-4 py-2 text-sm font-medium transition-colors
                      ${
                        selectedPeriod === period
                          ?  'bg-purple-100 text-primary'
                          : 'text-text-light hover:bg-gray-100'
                      }
                    `}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div
                className={`
                flex rounded-xl overflow-hidden border
                ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
              `}
              >
                <button
                  onClick={() => setActiveView('grid')}
                  className={`
                    p-2 transition-colors
                    ${
                      activeView === 'grid'
                        ?  'bg-purple-100 text-primary'
                        : 'text-text-light hover:bg-gray-100'
                    }
                  `}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setActiveView('list')}
                  className={`
                    p-2 transition-colors
                    ${
                      activeView === 'list'
                        ? 
                           'bg-purple-100 text-primary'
                        : 'text-text-light hover:bg-gray-100'
                    }
                  `}
                >
                  <List size={20} />
                </button>
              </div>

              {/* Quick Actions */}
              <button
                className='
                px-4 py-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 hover:opacity-90 hover:-translate-y-0.5
                text-white flex items-center space-x-2 transition-colors
              '
              >
                <PlusCircle size={18} />
                <span>Add New</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6'>
            {quickStats.map((stat, index) => (
              <MiniStatsCard key={index} stat={stat} />
            ))}
          </div>

          {/* Performance Goals */}
        
    <div className={`
      rounded-2xl overflow-hidden
      ${isDarkMode ? 'bg-gray-800/95' : 'bg-white'}
      shadow-lg backdrop-blur-sm
      border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}
      transition-all duration-300
    `}>
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h3 className={`
              font-bold text-xl
              ${isDarkMode ? 'text-white' : 'text-gray-800'}
            `}>
              Performance Goals
            </h3>
            <p className={`
              text-sm
              ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
            `}>
              Track your progress towards targets
            </p>
          </div>
          
          <button className="
            inline-flex items-center px-4 py-2 rounded-lg
            text-sm font-semibold
            bg-primary/5 text-primary
            hover:bg-primary/10 
            transition-all duration-200
          ">
            <span>View All Goals</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="p-6 grid grid-cols-1  xl:grid-cols-3 gap-6">
        {performanceGoals.map((goal, index) => (
          <div key={index} className="group">
            <div className={`
              relative p-6 rounded-xl
              ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}
              border ${isDarkMode ? 'border-gray-600' : 'border-gray-100'}
              hover:shadow-md transition-all duration-300
              transform hover:-translate-y-1
            `}>
              {/* Goal Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`
                    p-2.5 rounded-lg
                    ${goal.status === 'On Track' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-yellow-100 text-yellow-600'}
                    transition-colors duration-200
                  `}>
                    <goal.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`
                      font-semibold
                      ${isDarkMode ? 'text-white' : 'text-gray-800'}
                    `}>
                      {goal.title}
                    </h4>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`
                        text-xs font-medium px-2.5 py-1 rounded-full
                        ${goal.status === 'On Track'
                          ? 'bg-green-100/80 text-green-600'
                          : 'bg-yellow-100/80 text-yellow-600'}
                      `}>
                        {goal.status}
                      </span>
                      <span className={`
                        text-sm font-medium
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                      `}>
                        {goal.current}% / {goal.target}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <ProgressBar
                    current={goal.current}
                    target={goal.target}
                    color={goal.color as 'blue' | 'green' | 'yellow' | 'red' | 'purple'} // Type assertion

                  />
             
              {/* Action Button */}
              <button className="
                w-full px-4 py-2 mt-2 rounded-lg
                text-sm font-medium
                bg-white/5 hover:bg-white/10
                text-primary hover:text-primary-light
                border border-primary/10 hover:border-primary/20
                transition-all duration-200
                flex items-center justify-center space-x-2
              ">
                <span>View Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
     
          {/* Charts Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
            {/* Performance Chart */}
            <div 
            className={`
              rounded-2xl overflow-hidden p-6
              ${isDarkMode ? 'bg-gray-800/95' : 'bg-white'}
              shadow-lg backdrop-blur-sm
              border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}
              transition-all duration-300
            `}
            
            >
              <div className='flex justify-between items-center mb-6'>
                <div>
                  <h3
                    className={`font-semibold text-lg ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    Performance Metrics
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Student performance and attendance trends
                  </p>
                </div>
                <select
                  className={`
                  px-3 py-2 rounded-lg text-sm
                  ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }
                  border focus:outline-none focus:ring-2 focus:ring-blue-500/20
                `}
                >
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                  <option>All Time</option>
                </select>
              </div>
              {loading ? (
                <div className='h-[300px] flex items-center justify-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
                </div>
              ) : (
                <ResponsiveContainer width='100%' height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid
                      strokeDasharray='3 3'
                      stroke={isDarkMode ? '#374151' : '#E5E7EB'}
                    />
                    <XAxis
                      dataKey='month'
                      stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                    />
                    <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#1F2937' : '#FFF',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend />
                    <Line
                      type='monotone'
                      dataKey='students'
                      stroke='#3B82F6'
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#3B82F6' }}
                      activeDot={{ r: 6 }}
                      name='Student Performance'
                    />
                    <Line
                      type='monotone'
                      dataKey='attendance'
                      stroke='#10B981'
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#10B981' }}
                      activeDot={{ r: 6 }}
                      name='Attendance Rate'
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Timeline */}
            <div 
               className={`
                rounded-2xl overflow-hidden p-6
                ${isDarkMode ? 'bg-gray-800/95' : 'bg-white'}
                shadow-lg backdrop-blur-sm
                border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}
                transition-all duration-300
              `}
             
            >
              <div className='flex justify-between items-center mb-6'>
                <div>
                  <h3
                    className={`font-semibold text-lg ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    Recent Updates
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    System activities and updates
                  </p>
                </div>
                <button
                  className={`
                  text-sm font-medium
                  text-primary hover:text-primary-light'
                `}
                >
                  View All
                </button>
              </div>
              <Timeline items={timelineItems} />
            </div>
          </div>

          {/* Activity Table */}
          <div 
          className={`
            rounded-2xl overflow-hidden
            ${isDarkMode ? 'bg-gray-800/95' : 'bg-white'}
            shadow-lg backdrop-blur-sm
            border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}
            transition-all duration-300
          `}
           
          >
            <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
              <div className='flex justify-between items-center'>
                <div>
                  <h3
                    className={`font-semibold text-lg ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    Recent Activities
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Latest updates and activities
                  </p>
                </div>
                <div className='flex items-center space-x-2'>
                  <button
                    className={`
                    p-2 rounded-lg transition-colors
                    ${
                      isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-600'
                    }
                  `}
                  >
                    <Filter size={20} />
                  </button>
                  <button
                    className={`
                    p-2 rounded-lg transition-colors
                    ${
                      isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-600'
                    }
                  `}
                  >
                    <Download size={20} />
                  </button>
                  <button
                    className='
                    p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:-translate-y-0.5
                    text-accent transform transition-colors
                  '
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th
                      className={`
                      px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                    `}
                    >
                      User
                    </th>
                    <th
                      className={`
                      px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                    `}
                    >
                      Action
                    </th>
                    <th
                      className={`
                      px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                    `}
                    >
                      Course
                    </th>
                    <th
                      className={`
                      px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                    `}
                    >
                      Time
                    </th>
                    <th
                      className={`
                      px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                    `}
                    >
                      Status
                    </th>
                    <th
                      className={`
                      px-6 py-3 text-right text-xs font-medium uppercase tracking-wider
                      ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                    `}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`
                  divide-y
                  ${
                    isDarkMode
                      ? 'divide-gray-700 bg-gray-800'
                      : 'divide-gray-200 bg-white'
                  }
                `}
                >
                  {recentActivities.map((activity) => (
                    <tr
                      key={activity.id}
                      className={`
                      ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}
                      transition-colors
                    `}
                    >
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <img
                            src={activity.avatar}
                            alt=''
                            className='w-8 h-8 rounded-lg mr-3'
                          />
                          <span
                            className={`
                            font-medium
                            ${isDarkMode ? 'text-white' : 'text-text-light'}
                          `}
                          >
                            {activity.user}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`
                        px-6 py-4 whitespace-nowrap
                        ${isDarkMode ? 'text-gray-300' : 'text-text-light'}
                      `}
                      >
                        {activity.action}
                      </td>
                      <td
                        className={`
                        px-6 py-4 whitespace-nowrap
                        ${isDarkMode ? 'text-gray-300' : 'text-text-light'}
                      `}
                      >
                        {activity.course}
                      </td>
                      <td
                        className={`
                        px-6 py-4 whitespace-nowrap text-sm
                        ${isDarkMode ? 'text-gray-400' : 'text-text-light'}
                      `}
                      >
                        {activity.time}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`
                          px-3 py-1 text-xs rounded-full font-semibold
                          ${
                            activity.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : activity.status === 'Active'
                              ? 'bg-purple-100 text-primary'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                          ${isDarkMode && 'opacity-80'}
                        `}
                        >
                          {activity.status}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right'>
                        <div className='flex items-center justify-end space-x-2'>
                          <button
                            className={`
                            p-1 rounded-lg transition-colors
                            ${
                              isDarkMode
                                ? 'hover:bg-gray-700 text-gray-400'
                                : 'hover:bg-gray-100 text-gray-600'
                            }
                          `}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className={`
                            p-1 rounded-lg transition-colors
                            ${
                              isDarkMode
                                ? 'hover:bg-gray-700 text-gray-400'
                                : 'hover:bg-gray-100 text-gray-600'
                            }
                          `}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className={`
                            p-1 rounded-lg transition-colors text-red-500
                            ${
                              isDarkMode
                                ? 'hover:bg-red-500/10'
                                : 'hover:bg-red-50'
                            }
                          `}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ModernDashboard;


