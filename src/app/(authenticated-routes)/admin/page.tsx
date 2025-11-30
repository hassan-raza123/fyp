'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  FileText,
  Target,
  Award,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  trend?: 'up' | 'down';
  isDarkMode?: boolean;
}

const StatCard = ({ title, value, icon, change, trend, isDarkMode = false }: StatCardProps) => {
  const iconBgColor = isDarkMode 
    ? 'rgba(252, 153, 40, 0.15)' 
    : 'rgba(38, 40, 149, 0.15)';
  const iconColor = isDarkMode 
    ? 'var(--orange)' 
    : 'var(--blue)';
  
  return (
    <div className="bg-card border-card-border rounded-xl p-6 shadow-sm border transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-text">
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-1 text-primary-text">
            {value}
          </h3>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  trend === 'up' ? 'text-[var(--success-green)]' : 'text-[var(--error)]'
                }`}
              >
                {trend === 'up' ? (
                  <ArrowUpRight className="inline w-4 h-4" />
                ) : (
                  <ArrowDownRight className="inline w-4 h-4" />
                )}
                {change}%
              </span>
              <span className="text-sm text-muted-text ml-2">
                vs last month
              </span>
            </div>
          )}
        </div>
        <div 
          className="p-3 rounded-lg transition-transform duration-200 hover:scale-110"
          style={{
            backgroundColor: iconBgColor,
          }}
        >
          <div style={{ color: iconColor }}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ActivityItemProps {
  summary: string;
  user: string;
  time: string;
  icon: React.ReactNode;
  isDarkMode?: boolean;
}

const ActivityItem = ({ summary, user, time, icon, isDarkMode = false }: ActivityItemProps) => {
  const iconBgColor = isDarkMode 
    ? 'rgba(252, 153, 40, 0.1)' 
    : 'rgba(38, 40, 149, 0.1)';
  const iconColor = isDarkMode 
    ? 'var(--orange)' 
    : 'var(--blue)';
  
  return (
    <div 
      className="flex items-start space-x-4 p-4 rounded-lg transition-colors"
      style={{
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div 
        className="p-2 rounded-lg"
        style={{
          backgroundColor: iconBgColor,
        }}
      >
        <div style={{ color: iconColor }}>
          {icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary-text">
          {summary}
        </p>
        <p className="text-xs text-secondary-text">By {user}</p>
        <p className="text-xs text-muted-text mt-1">{time}</p>
      </div>
    </div>
  );
};

interface DashboardData {
  stats: {
    totalStudents: number;
    totalPrograms: number;
    totalCourses: number;
    totalFaculty: number;
  };
  recentActivities: Array<{
    id: string;
    summary: string;
    createdAt: string;
    user: string;
  }>;
  currentSemester: {
    name: string;
    startDate: string;
    endDate: string;
  };
}

export default function AdminOverview() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is super admin and redirect
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const verifyResponse = await fetch('/api/auth/verify', {
          credentials: 'include',
        });

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          if (verifyData.user?.role === 'super_admin') {
            // Redirect super admin to super-admin dashboard
            window.location.href = '/admin/super-admin';
            return;
          }
        }
      } catch (err) {
        console.error('Error checking user role:', err);
      }
    };

    checkUserRole();
  }, []);

  // Fetch dashboard data - admin always has a department assigned
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/overview', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };


  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div 
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderTopColor: isDarkMode ? 'var(--orange)' : 'var(--blue)',
              borderBottomColor: isDarkMode ? 'var(--orange)' : 'var(--blue)',
              borderRightColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
          ></div>
          <p className="text-sm text-secondary-text">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle 
            className="w-16 h-16 mx-auto mb-4" 
            style={{ color: 'var(--error)' }}
          />
          <div 
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--error)' }}
          >
            Error
          </div>
          <div className="text-secondary-text">{error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';

  return (
    <>
      {data && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-text">
                Department Dashboard
              </h1>
              <p className="text-secondary-text">
                Welcome back! Here's what's happening in your department.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.1)',
                  color: primaryColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.1)';
                }}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Generate Report
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Students"
              value={data.stats.totalStudents.toLocaleString()}
              icon={<Users className="w-6 h-6" />}
              change={12}
              trend="up"
              isDarkMode={isDarkMode}
            />
            <StatCard
              title="Active Programs"
              value={data.stats.totalPrograms}
              icon={<GraduationCap className="w-6 h-6" />}
              change={8}
              trend="up"
              isDarkMode={isDarkMode}
            />
            <StatCard
              title="Total Courses"
              value={data.stats.totalCourses}
              icon={<BookOpen className="w-6 h-6" />}
              change={-3}
              trend="down"
              isDarkMode={isDarkMode}
            />
            <StatCard
              title="Total Faculty"
              value={data.stats.totalFaculty}
              icon={<UserCheck className="w-6 h-6" />}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-card border-card-border rounded-xl shadow-sm border">
              <div className="p-6 border-b border-card-border">
                <h2 className="text-lg font-semibold text-primary-text">
                  Recent Activity
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {data.recentActivities.length === 0 ? (
                  <div className="p-6 text-center text-muted-text">
                    No recent activity.
                  </div>
                ) : (
                  data.recentActivities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      summary={activity.summary}
                      user={activity.user}
                      time={new Date(activity.createdAt).toLocaleString()}
                      icon={<Users className="w-5 h-5" />}
                      isDarkMode={isDarkMode}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              <div className="bg-card border-card-border rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-primary-text mb-4">
                  Quick Stats
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                      <span className="text-sm text-secondary-text">
                        Current Semester
                      </span>
                    </div>
                    <span className="text-sm font-medium text-primary-text">
                      {data.currentSemester
                        ? data.currentSemester.name
                        : 'No active semester'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <BarChart2 className="w-5 h-5" style={{ color: primaryColor }} />
                      <span className="text-sm text-secondary-text">
                        Average GPA
                      </span>
                    </div>
                    <span className="text-sm font-medium text-primary-text">
                      3.45
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5" style={{ color: primaryColor }} />
                      <span className="text-sm text-secondary-text">
                        Enrollment Rate
                      </span>
                    </div>
                    <span className="text-sm font-medium text-primary-text">
                      +15%
                    </span>
                  </div>
                </div>
              </div>

              <div 
                className="rounded-xl shadow-sm p-6 text-white"
                style={{
                  background: `linear-gradient(to bottom right, ${primaryColor}, ${primaryColorDark})`
                }}
              >
                <h2 className="text-lg font-semibold mb-2">Need Help?</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--white-opacity-80)' }}>
                  Get support from our team or check the documentation
                </p>
                <button 
                  className="w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  style={{
                    backgroundColor: 'var(--white-opacity-10)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--white-opacity-20)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--white-opacity-10)';
                  }}
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
