'use client';

import React, { useEffect, useState } from 'react';
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
import { toast } from 'sonner';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  trend?: 'up' | 'down';
}

const StatCard = ({ title, value, icon, change, trend }: StatCardProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
          {value}
        </h3>
        {change !== undefined && (
          <div className="flex items-center mt-2">
            <span
              className={`text-sm font-medium ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend === 'up' ? (
                <ArrowUpRight className="inline w-4 h-4" />
              ) : (
                <ArrowDownRight className="inline w-4 h-4" />
              )}
              {change}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              vs last month
            </span>
          </div>
        )}
      </div>
      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        {icon}
      </div>
    </div>
  </div>
);

interface ActivityItemProps {
  summary: string;
  user: string;
  time: string;
  icon: React.ReactNode;
}

const ActivityItem = ({ summary, user, time, icon }: ActivityItemProps) => (
  <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {summary}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">By {user}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{time}</p>
    </div>
  </div>
);

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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [isSavingDepartment, setIsSavingDepartment] = useState(false);

  // Check if department is configured
  useEffect(() => {
    const checkDepartment = async () => {
      try {
        const settingsResponse = await fetch('/api/settings', {
          credentials: 'include',
        });

        // If response is not ok, show modal (might be 401, 500, etc.)
        if (!settingsResponse.ok) {
          console.warn('Settings API returned error:', settingsResponse.status);
          setShowDepartmentModal(true);
          setLoading(false);
          return;
        }

        const settingsData = await settingsResponse.json();

        // If API returned error, show modal
        if (!settingsData.success) {
          console.warn('Settings API returned error:', settingsData.error);
          setShowDepartmentModal(true);
          setLoading(false);
          return;
        }

        if (settingsData.data) {
          const systemSettings =
            typeof settingsData.data.system === 'string'
              ? JSON.parse(settingsData.data.system)
              : settingsData.data.system;

          const deptCode = systemSettings?.departmentCode;
          const deptName = systemSettings?.departmentName;

          // If department is not configured, show modal
          if (!deptCode || !deptName) {
            setShowDepartmentModal(true);
            setLoading(false);
          } else {
            // Department is configured, fetch dashboard data
            fetchDashboardData();
          }
        } else {
          // No settings data, show modal
          setShowDepartmentModal(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error checking department:', err);
        // On any error (network, etc.), show modal to configure department
        setShowDepartmentModal(true);
        setLoading(false);
      }
    };

    checkDepartment();
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

  const handleSaveDepartment = async () => {
    if (!departmentName.trim() || !departmentCode.trim()) {
      toast.error('Please enter both department name and code');
      return;
    }

    setIsSavingDepartment(true);
    try {
      // First, get current settings
      const settingsResponse = await fetch('/api/settings', {
        credentials: 'include',
      });
      if (!settingsResponse.ok) {
        throw new Error('Failed to fetch settings');
      }
      const settingsData = await settingsResponse.json();

      let currentSettings =
        settingsData.success && settingsData.data
          ? settingsData.data
          : {
              system: {
                applicationName: 'Smart Campus for MNSUET',
                academicYear: '2024',
                currentSemester: 'Spring',
                defaultLanguage: 'en',
                timeZone: 'UTC',
                departmentName: '',
                departmentCode: '',
              },
              email: {
                smtpHost: '',
                smtpPort: '',
                smtpUsername: '',
                smtpPassword: '',
                fromEmail: '',
                fromName: '',
              },
              notifications: {
                enabled: true,
                channels: {
                  email: true,
                  push: false,
                  sms: false,
                },
              },
            };

      // Update system settings with department info
      const systemSettings =
        typeof currentSettings.system === 'string'
          ? JSON.parse(currentSettings.system)
          : currentSettings.system;

      systemSettings.departmentName = departmentName.trim();
      systemSettings.departmentCode = departmentCode.trim().toUpperCase();

      // Save settings
      const saveResponse = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...currentSettings,
          system: systemSettings,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save department');
      }

      const saveData = await saveResponse.json();
      if (saveData.success) {
        toast.success(
          `Department "${departmentName}" (${departmentCode}) configured successfully!`
        );
        setShowDepartmentModal(false);
        // Now fetch dashboard data
        fetchDashboardData();
      } else {
        throw new Error(saveData.error || 'Failed to save department');
      }
    } catch (err) {
      console.error('Error saving department:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to save department'
      );
    } finally {
      setIsSavingDepartment(false);
    }
  };

  if (loading && !showDepartmentModal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error && !showDepartmentModal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      {/* Department Setup Modal */}
      <Dialog open={showDepartmentModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[500px]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  Department Setup Required
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Please configure your department before using the system
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>Important:</strong> You need to set up your department
                information first. This will be used throughout the system for
                all operations.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="departmentName">
                  Department Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="departmentName"
                  placeholder="e.g., Computer Science"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  disabled={isSavingDepartment}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentCode">
                  Department Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="departmentCode"
                  placeholder="e.g., CS"
                  value={departmentCode}
                  onChange={(e) =>
                    setDepartmentCode(e.target.value.toUpperCase())
                  }
                  maxLength={10}
                  disabled={isSavingDepartment}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Short code for your department (max 10 characters)
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSaveDepartment}
              disabled={
                isSavingDepartment ||
                !departmentName.trim() ||
                !departmentCode.trim()
              }
              className="w-full sm:w-auto"
            >
              {isSavingDepartment ? 'Saving...' : 'Save & Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!showDepartmentModal && data && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Department Dashboard
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Welcome back! Here's what's happening in your department.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-primary rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
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
              icon={
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              }
              change={12}
              trend="up"
            />
            <StatCard
              title="Active Programs"
              value={data.stats.totalPrograms}
              icon={
                <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              }
              change={8}
              trend="up"
            />
            <StatCard
              title="Total Courses"
              value={data.stats.totalCourses}
              icon={
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              }
              change={-3}
              trend="down"
            />
            <StatCard
              title="Total Faculty"
              value={data.stats.totalFaculty}
              icon={
                <UserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              }
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.recentActivities.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 dark:text-gray-500">
                    No recent activity.
                  </div>
                ) : (
                  data.recentActivities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      summary={activity.summary}
                      user={activity.user}
                      time={new Date(activity.createdAt).toLocaleString()}
                      icon={
                        <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      }
                    />
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Stats
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Current Semester
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {data.currentSemester
                        ? data.currentSemester.name
                        : 'No active semester'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Average GPA
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      3.45
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Enrollment Rate
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      +15%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-sm p-6 text-white">
                <h2 className="text-lg font-semibold mb-2">Need Help?</h2>
                <p className="text-sm text-purple-100 mb-4">
                  Get support from our team or check the documentation
                </p>
                <button className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium">
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
