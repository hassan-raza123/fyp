'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Building2,
  Users,
  Shield,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface DashboardData {
  stats: {
    totalDepartments: number;
    totalAdmins: number;
    assignedDepartments: number;
    unassignedDepartments: number;
  };
  recentActivities: Array<{
    id: string;
    summary: string;
    createdAt: string;
    user: string;
    userRole: string;
    userEmail: string;
  }>;
  currentSemester: {
    name: string;
    startDate: string;
    endDate: string;
  } | null;
}

interface AnalyticsData {
  enrollmentTrend: { month: string; students: number }[];
  departmentDistribution: { name: string; value: number }[];
  activityTrend: { date: string; activities: number }[];
  stats: {
    totalStudents: number;
    totalFaculty: number;
    totalPrograms: number;
    totalCourses: number;
    totalDepartments: number;
    totalAdmins: number;
  };
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: number;
  isDarkMode?: boolean;
}

const StatCard = ({ title, value, icon, subtitle, trend, isDarkMode = false }: StatCardProps) => {
  const iconBgColor = isDarkMode 
    ? 'rgba(252, 153, 40, 0.15)' 
    : 'rgba(38, 40, 149, 0.15)';
  const iconColor = isDarkMode 
    ? 'var(--orange)' 
    : 'var(--blue)';
  
  return (
    <div className="rounded-xl p-4 shadow-sm border bg-card border-card-border transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:hover:border-secondary/20 group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-secondary-text mb-1.5">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-primary-text mb-1">
            {value}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-muted-text">
              {subtitle}
            </p>
          )}
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              <ArrowUpRight className={`w-3 h-3 mr-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-xs font-semibold ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-muted-text ml-1.5">vs last month</span>
            </div>
          )}
        </div>
        <div 
          className="p-2.5 rounded-lg transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: iconBgColor }}
        >
          <div style={{ color: iconColor }}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

const CHART_COLORS = ['#262895', '#fc9928', '#433ea7', '#e6891f', '#1c1e74', '#ffb347'];

export default function SuperAdminDashboard() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchAnalyticsData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true);
      const response = await fetch('/api/super-admin/overview', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch('/api/super-admin/analytics', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      toast.error('Failed to load analytics data');
    } finally {
      setAnalyticsLoading(false);
      }
  };

  if (!mounted || dashboardLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary dark:border-secondary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
      );
  }

  if (!dashboardData || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-page">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Failed to load dashboard data
          </p>
        </div>
      </div>
    );
  }

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  
  // Calculate assignment rate
  const assignmentRate = dashboardData.stats.totalDepartments > 0
    ? Math.round((dashboardData.stats.assignedDepartments / dashboardData.stats.totalDepartments) * 100)
    : 0;
  
  return (
    <div className="space-y-5">
      {/* Header - Modern & Compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-primary-text">
            <div 
              className="p-2 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColorDark})`,
              }}
          >
              <Shield className="h-5 w-5 text-white" />
            </div>
            System Overview
          </h1>
          <p className="text-xs mt-1.5 text-secondary-text">
            Complete system analytics and management insights
          </p>
        </div>
          <Button
          onClick={() => window.location.href = '/super-admin/departments'}
          className="text-xs h-8 px-3"
            style={{
              backgroundColor: primaryColor,
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = primaryColorDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = primaryColor;
            }}
          >
          Manage Departments
          </Button>
      </div>

      {/* Key Stats - Essential Only */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
          title="Departments"
          value={analyticsData.stats.totalDepartments}
          subtitle={`${dashboardData.stats.assignedDepartments} assigned`}
            icon={<Building2 className="w-5 h-5" />}
            isDarkMode={isDarkMode}
          />
          <StatCard
          title="Admins"
          value={analyticsData.stats.totalAdmins}
          subtitle={`${assignmentRate}% assigned`}
            icon={<Shield className="w-5 h-5" />}
            isDarkMode={isDarkMode}
          />
          <StatCard
          title="Students"
          value={analyticsData.stats.totalStudents.toLocaleString()}
          subtitle="Total enrolled"
          icon={<Users className="w-5 h-5" />}
          trend={8}
            isDarkMode={isDarkMode}
          />
          <StatCard
          title="Faculty"
          value={analyticsData.stats.totalFaculty}
          subtitle="Active members"
          icon={<UserCheck className="w-5 h-5" />}
            isDarkMode={isDarkMode}
          />
        </div>

      {/* Critical Alerts */}
      {dashboardData.stats.unassignedDepartments > 0 && (
        <div 
          className="rounded-xl p-4 border-2 flex items-center gap-3"
          style={{
            backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(252, 153, 40, 0.05)',
            borderColor: isDarkMode ? 'rgba(252, 153, 40, 0.3)' : 'rgba(252, 153, 40, 0.2)',
          }}
          >
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--orange)' }} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary-text">
              {dashboardData.stats.unassignedDepartments} Department{dashboardData.stats.unassignedDepartments > 1 ? 's' : ''} Unassigned
            </p>
            <p className="text-xs text-secondary-text mt-0.5">
              Assign admins to departments for proper management
            </p>
            </div>
          <Button
            onClick={() => window.location.href = '/super-admin/departments'}
            className="text-xs h-7 px-3"
            style={{
              backgroundColor: 'var(--orange)',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--orange-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--orange)';
            }}
          >
            Assign Now
          </Button>
                </div>
      )}

      {/* Essential Charts - Only Important Ones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Enrollment Trend - Most Important */}
        <div className="rounded-xl shadow-sm border bg-card border-card-border p-5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-primary-text flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: primaryColor }} />
                Student Enrollment Trend
              </h3>
              <p className="text-[10px] text-secondary-text mt-0.5">Last 12 months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analyticsData.enrollmentTrend} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#404040' : '#e5e5e5'} opacity={0.2} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: isDarkMode ? '#a3a3a3' : '#737373' }}
                stroke={isDarkMode ? '#525252' : '#d4d4d4'}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: isDarkMode ? '#a3a3a3' : '#737373' }}
                stroke={isDarkMode ? '#525252' : '#d4d4d4'}
                width={45}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? '#171717' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#404040' : '#e5e5e5'}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '8px 12px',
                }}
                labelStyle={{ 
                  color: isDarkMode ? '#ffffff' : '#000000', 
                  marginBottom: '6px',
                  fontWeight: 600,
                }}
              />
              <Line 
                type="monotone" 
                dataKey="students" 
                stroke={primaryColor}
                strokeWidth={3}
                dot={{ fill: primaryColor, r: 4, strokeWidth: 2, stroke: isDarkMode ? '#171717' : '#ffffff' }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
          </div>

        {/* Department Distribution - Important for Super Admin */}
        <div className="rounded-xl shadow-sm border bg-card border-card-border p-5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-primary-text flex items-center gap-2">
                <Building2 className="w-4 h-4" style={{ color: primaryColor }} />
                Department Distribution
              </h3>
              <p className="text-[10px] text-secondary-text mt-0.5">Students by department</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={analyticsData.departmentDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ''}
                outerRadius={75}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.departmentDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? '#171717' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#404040' : '#e5e5e5'}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '8px 12px',
                }}
                formatter={(value: any, name: string) => [`${value} students`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {analyticsData.departmentDistribution.slice(0, 4).map((dept, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                <span className="text-[10px] text-secondary-text truncate max-w-[80px]">
                  {dept.name}
                    </span>
                  </div>
            ))}
                </div>
              </div>
            </div>

      {/* System Status & Recent Activity - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* System Status - Essential Info */}
        <div className="rounded-xl shadow-sm border bg-card border-card-border p-4">
          <h3 className="text-sm font-bold text-primary-text mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" style={{ color: primaryColor }} />
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-hover-bg">
              <span className="text-xs text-secondary-text">Assigned</span>
              <span className="text-sm font-bold text-primary-text">
                {dashboardData.stats.assignedDepartments}/{dashboardData.stats.totalDepartments}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-hover-bg">
              <span className="text-xs text-secondary-text">Unassigned</span>
              <span 
                className="text-sm font-bold"
              style={{
                  color: dashboardData.stats.unassignedDepartments > 0 
                    ? 'var(--orange)' 
                    : 'var(--primary-text)' 
                }}
              >
                {dashboardData.stats.unassignedDepartments}
                  </span>
                </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-hover-bg">
              <span className="text-xs text-secondary-text">Current Semester</span>
              <span className="text-xs font-semibold text-primary-text">
                {dashboardData.currentSemester?.name || 'None'}
                  </span>
                </div>
            <div className="pt-2 border-t border-card-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-text">Assignment Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-hover-bg overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${assignmentRate}%`,
                        backgroundColor: primaryColor,
                      }}
                    />
                </div>
                  <span className="text-xs font-bold text-primary-text w-8 text-right">
                    {assignmentRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity - Compact */}
        <div className="lg:col-span-2 rounded-xl shadow-sm border bg-card border-card-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-primary-text flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: primaryColor }} />
              Recent System Activity
            </h3>
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/super-admin/departments'}
              className="text-xs h-6 px-2 text-secondary-text hover:text-primary-text"
            >
              View All
            </Button>
          </div>
          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {dashboardData.recentActivities.length === 0 ? (
              <div className="text-center text-xs text-muted-text py-6">
                No recent activity
              </div>
            ) : (
              dashboardData.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-hover-bg transition-colors group"
                >
                  <div 
                    className="p-1.5 rounded-md flex-shrink-0 mt-0.5"
                    style={{
                                  backgroundColor: isDarkMode 
                        ? 'rgba(252, 153, 40, 0.1)' 
                                    : 'rgba(38, 40, 149, 0.1)',
                    }}
                        >
                    <Activity 
                      className="w-3 h-3" 
                style={{ color: primaryColor }}
              />
            </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary-text line-clamp-2">
                      {activity.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-secondary-text">
                        {activity.user}
                      </span>
                      <span className="text-[10px] text-muted-text">•</span>
                      <span className="text-[10px] text-muted-text">
                        {new Date(activity.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
            </div>
            </div>
          </div>
              ))
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
