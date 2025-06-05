'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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
} from 'lucide-react';
import {
  MiniStatsCardProps,
  ProgressBarProps,
  TimelineProps,
} from '@/app/types/dashboard';
import { LucideProps } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface SidebarNavLinkProps {
  item: {
    id: string;
    label: string;
    icon: React.ForwardRefExoticComponent<
      Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
    >;
    badge?: number;
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
}: SidebarNavLinkProps) => (
  <Link
    href={`/admin/${item.id}`}
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
      {item.badge && item.badge > 0 && (
        <span
          className={`absolute -top-1 ${
            isSidebarOpen ? 'left-5' : '-right-1'
          } w-5 h-5 bg-red-500 text-accent text-[11px] rounded-full flex items-center justify-center`}
        >
          {item.badge}
        </span>
      )}
      {isSidebarOpen && (
        <span className='ml-3 font-medium text-sm'>{item.label}</span>
      )}
    </div>
  </Link>
);

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
        { id: 'programs', icon: GraduationCap, label: 'Programs', badge: 0 },
        { id: 'courses', icon: BookOpen, label: 'Courses', badge: 2 },
        { id: 'grades', icon: GraduationCap, label: 'Grades', badge: 0 },
        { id: 'departments', icon: Layers, label: 'Departments', badge: 0 },
      ],
    },
    {
      title: 'Management',
      items: [
        { id: 'users', icon: Users, label: 'Users', badge: 0 },
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
            <AreaChart data={stat.trend.map((value) => ({ value }))}>
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

  const ProgressBar: React.FC<ProgressBarProps> = ({
    current,
    target,
    color,
  }) => {
    const getColorClasses = (color: ProgressBarProps['color']) => {
      const backgrounds: Record<
        ProgressBarProps['color'],
        { bg: string; bgLight: string }
      > = {
        blue: {
          bg: 'bg-blue-300',
          bgLight: 'bg-blue-100',
        },
        green: {
          bg: 'bg-green-300',
          bgLight: 'bg-green-100',
        },
        yellow: {
          bg: 'bg-yellow-300',
          bgLight: 'bg-yellow-100',
        },
        red: {
          bg: 'bg-red-300',
          bgLight: 'bg-red-100',
        },
        purple: {
          bg: 'bg-purple-300',
          bgLight: 'bg-purple-100',
        },
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

  return (
    <div className='space-y-6'>
      {/* Dashboard content */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {/* Your dashboard cards and content here */}
      </div>

      {/* Rest of your dashboard content */}
    </div>
  );
};

export default ModernDashboard;
