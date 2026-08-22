'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { PageLoading } from '@/components/ui/page-loading';
import { PageError } from '@/components/ui/page-error';
import { useRouter } from 'next/navigation';
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import ContactForm from '@/components/forms/ContactForm';
import { StatCard } from '@/components/ui/stat-card';

interface ActivityItemProps {
  summary: string;
  user: string;
  time: string;
  icon: React.ReactNode;
  isDarkMode?: boolean;
}

const ActivityItem = ({ summary, user, time, icon, isDarkMode = false }: ActivityItemProps) => {
  const iconBgColor = isDarkMode 
    ? 'var(--brand-primary-opacity-10)' 
    : 'var(--brand-primary-opacity-10)';
  const iconColor = isDarkMode 
    ? 'var(--accent)' 
    : 'var(--accent)';
  
  return (
    <div 
      className="flex items-start space-x-3 p-3 rounded-lg transition-colors"
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
        className="p-1.5 rounded-lg"
        style={{
          backgroundColor: iconBgColor,
        }}
      >
        <div style={{ color: iconColor }}>
          {icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary-text">
          {summary}
        </p>
        <p className="text-[10px] text-secondary-text">By {user}</p>
        <p className="text-[10px] text-muted-text mt-1">{time}</p>
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
    averageGPA?: number;
    retentionRate?: number;
    programCompletion?: number;
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
  enrollmentTrend?: Array<{
    month: string;
    students: number;
  }>;
  programDistribution?: Array<{
    name: string;
    value: number;
  }>;
  gpaDistribution?: Array<{
    gpa: number;
    students: number;
  }>;
}

export default function AdminOverview() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  
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


  if (!mounted || loading) return <PageLoading message="Loading dashboard..." />;
  if (error) return <PageError message={error} />;

  if (!data) {
    return null;
  }

  const primaryColor = 'var(--accent)';
  const primaryColorDark = 'var(--accent-hover)';

  return (
    <>
      {data && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-primary-text">
                Department Dashboard
              </h1>
              <p className="text-xs text-secondary-text mt-0.5">
                Welcome back! Here's what's happening in your department.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/admin/reports')}
                className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
                style={{
                  backgroundColor: 'var(--brand-primary-opacity-10)',
                  color: primaryColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--brand-primary-opacity-20)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--brand-primary-opacity-10)';
                }}
              >
                <FileText className="w-3.5 h-3.5 inline mr-1.5" />
                Generate Report
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Students"
              value={data.stats.totalStudents.toLocaleString()}
              icon={<Users />}
            />
            <StatCard
              label="Active Programs"
              value={data.stats.totalPrograms}
              icon={<GraduationCap />}
            />
            <StatCard
              label="Total Courses"
              value={data.stats.totalCourses}
              icon={<BookOpen />}
            />
            <StatCard
              label="Total Faculty"
              value={data.stats.totalFaculty}
              icon={<UserCheck />}
            />
          </div>

          {/* Charts Section */}
          {(data.enrollmentTrend || data.programDistribution || data.gpaDistribution) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Enrollment Trend Chart */}
              {data.enrollmentTrend && data.enrollmentTrend.length > 0 && (
                <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
                  <h2 className="text-sm font-semibold text-primary-text mb-3">
                    Enrollment Trend
                  </h2>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.enrollmentTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke={'var(--border-color)'} opacity={0.2} />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                          stroke={'var(--border-firm)'}
                          angle={-35}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis 
                          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                          stroke={'var(--border-firm)'}
                          width={40}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'var(--surface)',
                            border: `1px solid ${'var(--border-color)'}`,
                            color: 'var(--text-primary)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            padding: '8px 12px',
                          }}
                          labelStyle={{ 
                            color: 'var(--text-primary)', 
                            marginBottom: '6px',
                            fontWeight: 600,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="students"
                          stroke={primaryColor}
                          strokeWidth={2}
                          dot={{ fill: primaryColor, r: 3, strokeWidth: 2, stroke: 'var(--white)' }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Program Distribution Chart */}
              {data.programDistribution && data.programDistribution.length > 0 && (
                <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
                  <h2 className="text-sm font-semibold text-primary-text mb-3">
                    Program Distribution
                  </h2>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.programDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          fill="var(--chart-1)"
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {data.programDistribution.map((entry, index) => {
                            const COLORS = ['var(--accent)', 'var(--primary-400)', 'var(--accent-hover)', 'var(--accent)', 'var(--accent-hover)'];
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'var(--surface)',
                            border: `1px solid ${'var(--border-color)'}`,
                            color: 'var(--text-primary)',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {data.programDistribution.slice(0, 4).map((program, index) => {
                      const COLORS = ['var(--accent)', 'var(--primary-400)', 'var(--accent-hover)', 'var(--accent)', 'var(--accent-hover)'];
                      return (
                        <div key={program.name} className="flex items-center space-x-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-[10px] text-secondary-text truncate">
                            {program.name}
                          </span>
                          <span className="text-[10px] font-medium text-primary-text">
                            {program.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GPA Distribution Chart */}
          {data.gpaDistribution && data.gpaDistribution.length > 0 && (
            <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-semibold text-primary-text mb-3">
                GPA Distribution
              </h2>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.gpaDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke={'var(--border-color)'} opacity={0.2} />
                    <XAxis 
                      dataKey="gpa" 
                      tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                      stroke={'var(--border-firm)'}
                      label={{ value: 'GPA Range', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: 'var(--text-muted)' } }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                      stroke={'var(--border-firm)'}
                      width={40}
                      label={{ value: 'Students', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'var(--text-muted)' } }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: `1px solid ${'var(--border-color)'}`,
                        color: 'var(--text-primary)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        padding: '8px 12px',
                      }}
                      labelStyle={{ 
                        color: 'var(--text-primary)', 
                        marginBottom: '6px',
                        fontWeight: 600,
                      }}
                    />
                    <Bar
                      dataKey="students"
                      fill={primaryColor}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-card border-card-border rounded-xl shadow-sm border">
              <div className="p-4 border-b border-card-border">
                <h2 className="text-sm font-semibold text-primary-text">
                  Recent Activity
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {data.recentActivities.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-text">
                    No recent activity.
                  </div>
                ) : (
                  data.recentActivities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      summary={activity.summary}
                      user={activity.user}
                      time={new Date(activity.createdAt).toLocaleString()}
                      icon={<Users />}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
                <h2 className="text-sm font-semibold text-primary-text mb-3">
                  Quick Stats
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className="text-xs text-secondary-text">
                        Current Semester
                      </span>
                    </div>
                    <span className="text-xs font-medium text-primary-text">
                      {data.currentSemester
                        ? data.currentSemester.name
                        : 'No active semester'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart2 className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className="text-xs text-secondary-text">
                        Average GPA
                      </span>
                    </div>
                    <span className="text-xs font-medium text-primary-text">
                      {data.stats.averageGPA ? data.stats.averageGPA.toFixed(2) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className="text-xs text-secondary-text">
                        Retention Rate
                      </span>
                    </div>
                    <span className="text-xs font-medium text-primary-text">
                      {data.stats.retentionRate ? Math.round(data.stats.retentionRate * 100) + '%' : 'N/A'}
                    </span>
                  </div>
                  {data.stats.programCompletion !== undefined && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4" style={{ color: primaryColor }} />
                        <span className="text-xs text-secondary-text">
                          Graduated
                        </span>
                      </div>
                      <span className="text-xs font-medium text-primary-text">
                        {data.stats.programCompletion}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div 
                className="rounded-xl shadow-sm p-4 text-white"
                style={{
                  background: `linear-gradient(to bottom right, ${primaryColor}, ${primaryColorDark})`
                }}
              >
                <h2 className="text-sm font-semibold mb-1.5">Need Help?</h2>
                <p className="text-xs mb-3" style={{ color: 'var(--white-opacity-80)' }}>
                  Get support from our team or check the documentation
                </p>
                <button 
                  onClick={() => setIsContactDialogOpen(true)}
                  className="w-full px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
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

      {/* Contact Support Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: primaryColor }}>
              Contact Support
            </DialogTitle>
            <DialogDescription className="text-xs text-secondary-text">
              Need help? Fill out the form below and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ContactForm />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}




