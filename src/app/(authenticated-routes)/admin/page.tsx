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
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [departments, setDepartments] = useState<
    Array<{ id: number; name: string; code: string }>
  >([]);
  const [isSavingDepartment, setIsSavingDepartment] = useState(false);

  // Check if admin has a department assigned
  useEffect(() => {
    const checkDepartment = async () => {
      try {
        // First check if admin has a department assigned
        const checkResponse = await fetch('/api/admin/check-department', {
          credentials: 'include',
        });

        if (!checkResponse.ok) {
          throw new Error('Failed to check department');
        }

        const checkData = await checkResponse.json();

        if (!checkData.success) {
          throw new Error(checkData.error || 'Failed to check department');
        }

        // If admin doesn't have a department, show selection modal
        if (!checkData.hasDepartment) {
          // Fetch all departments for selection
          const deptResponse = await fetch('/api/departments', {
            credentials: 'include',
          });

          if (!deptResponse.ok) {
            throw new Error('Failed to fetch departments');
          }

          const deptData = await deptResponse.json();
          if (deptData.success && deptData.data) {
            setDepartments(deptData.data);
            setShowDepartmentModal(true);
          } else {
            throw new Error('No departments available');
          }
          setLoading(false);
        } else {
          // Admin has department, fetch dashboard data
          fetchDashboardData();
        }
      } catch (err) {
        console.error('Error checking department:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to check department'
        );
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
    if (!selectedDepartmentId) {
      toast.error('Please select a department');
      return;
    }

    setIsSavingDepartment(true);
    try {
      // Assign department to admin
      const assignResponse = await fetch('/api/admin/assign-department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          departmentId: parseInt(selectedDepartmentId),
        }),
      });

      if (!assignResponse.ok) {
        throw new Error('Failed to assign department');
      }

      const assignData = await assignResponse.json();
      if (assignData.success) {
        const selectedDept = departments.find(
          (d) => d.id.toString() === selectedDepartmentId
        );
        toast.success(
          `Department "${selectedDept?.name}" (${selectedDept?.code}) assigned successfully!`
        );
        setShowDepartmentModal(false);
        // Now fetch dashboard data
        fetchDashboardData();
      } else {
        throw new Error(assignData.error || 'Failed to assign department');
      }
    } catch (err) {
      console.error('Error assigning department:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to assign department'
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
                <strong>Important:</strong> Please select your department to
                continue. This will be used throughout the system for all
                operations.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department">
                  Select Department <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedDepartmentId}
                  onValueChange={setSelectedDepartmentId}
                  disabled={isSavingDepartment}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Choose your department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No departments available
                      </SelectItem>
                    ) : (
                      departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select the department you will be managing
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSaveDepartment}
              disabled={isSavingDepartment || !selectedDepartmentId}
              className="w-full sm:w-auto"
            >
              {isSavingDepartment ? 'Assigning...' : 'Select & Continue'}
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
