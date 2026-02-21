'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Check,
  CheckCheck,
  AlertCircle,
  FileText,
  Award,
  Calendar,
  Target,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { notification_type } from '@prisma/client';

interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: notification_type;
  isRead: boolean;
  createdAt: string;
}

export default function StudentNotificationsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [typeFilter, readFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (readFilter !== 'all') {
        params.append('isRead', readFilter === 'read' ? 'true' : 'false');
      }

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const result = await response.json();
      if (result.success) {
        setNotifications(result.data);
        setUnreadCount(
          result.data.filter((n: Notification) => !n.isRead).length
        );
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) throw new Error('Failed to update notification');
      fetchNotifications();
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error updating notification:', error);
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(`/api/notifications/${n.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ isRead: true }),
          })
        )
      );
      fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type: notification_type) => {
    switch (type) {
      case 'assessment':
        return <FileText className="w-5 h-5" />;
      case 'grade':
        return <Award className="w-5 h-5" />;
      case 'result':
        return <Target className="w-5 h-5" />;
      case 'course':
        return <BookOpen className="w-5 h-5" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5" />;
      case 'announcement':
        return <Bell className="w-5 h-5" />;
      case 'system':
        return <Bell className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationBadgeColor = (type: notification_type) => {
    switch (type) {
      case 'assessment':
        return 'bg-[var(--blue)]';
      case 'grade':
        return 'bg-[var(--success-green)]';
      case 'result':
        return 'bg-[var(--blue)]';
      case 'course':
        return 'bg-[var(--orange)] dark:bg-[var(--orange)]';
      case 'alert':
        return 'bg-[var(--error)]';
      case 'announcement':
        return 'bg-[var(--blue)]';
      case 'system':
        return 'bg-[var(--gray-500)]';
      default:
        return 'bg-[var(--gray-500)]';
    }
  };

  const getNotificationTypeLabel = (type: notification_type) => {
    switch (type) {
      case 'assessment':
        return 'Assessment';
      case 'grade':
        return 'Grade';
      case 'result':
        return 'Result';
      case 'course':
        return 'Course';
      case 'alert':
        return 'Alert';
      case 'announcement':
        return 'Announcement';
      case 'system':
        return 'System';
      default:
        return 'Notification';
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    if (readFilter === 'read' && !notification.isRead) return false;
    if (readFilter === 'unread' && notification.isRead) return false;
    return true;
  });

  // Calculate statistics
  const totalNotifications = notifications.length;
  const readNotifications = notifications.filter((n) => n.isRead).length;
  const assessmentNotifications = notifications.filter(
    (n) => n.type === 'assessment'
  ).length;
  const gradeNotifications = notifications.filter((n) => n.type === 'grade')
    .length;

  if (!mounted || (loading && notifications.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderTopColor: primaryColor,
              borderBottomColor: primaryColor,
              borderRightColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
          />
          <p className="text-xs text-secondary-text">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <Bell className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">Notifications</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Stay updated with assessment, grade, and system notifications
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 flex items-center gap-1.5 transition-colors"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = iconBgColor;
            }}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-card-border rounded-lg p-4">
          <p className="text-xs font-medium text-secondary-text">Total Notifications</p>
          <div className="text-lg font-bold text-primary-text mt-0.5">{totalNotifications}</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4">
          <p className="text-xs font-medium text-secondary-text">Unread</p>
          <div className="text-lg font-bold text-primary-text mt-0.5">{unreadCount}</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4">
          <p className="text-xs font-medium text-secondary-text">Assessments</p>
          <div className="text-lg font-bold text-primary-text mt-0.5">{assessmentNotifications}</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4">
          <p className="text-xs font-medium text-secondary-text">Grades</p>
          <div className="text-lg font-bold text-primary-text mt-0.5">{gradeNotifications}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="p-4 border-b border-card-border">
          <h2 className="text-sm font-semibold text-primary-text">Filters</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-primary-text">Filter by Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Types</SelectItem>
                  <SelectItem value="assessment" className="text-primary-text hover:bg-card/50">Assessment</SelectItem>
                  <SelectItem value="grade" className="text-primary-text hover:bg-card/50">Grade</SelectItem>
                  <SelectItem value="result" className="text-primary-text hover:bg-card/50">Result</SelectItem>
                  <SelectItem value="course" className="text-primary-text hover:bg-card/50">Course</SelectItem>
                  <SelectItem value="announcement" className="text-primary-text hover:bg-card/50">Announcement</SelectItem>
                  <SelectItem value="system" className="text-primary-text hover:bg-card/50">System</SelectItem>
                  <SelectItem value="alert" className="text-primary-text hover:bg-card/50">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-primary-text">Filter by Status</label>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Status</SelectItem>
                  <SelectItem value="unread" className="text-primary-text hover:bg-card/50">Unread</SelectItem>
                  <SelectItem value="read" className="text-primary-text hover:bg-card/50">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="p-4 border-b border-card-border">
          <h2 className="text-sm font-semibold text-primary-text">Notifications</h2>
          <p className="text-xs text-secondary-text mt-0.5">{filteredNotifications.length} notification(s) found</p>
        </div>
        <div className="p-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-text opacity-50" />
              <p className="text-xs text-secondary-text">No notifications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border border-card-border ${
                    notification.isRead ? 'bg-hover-bg/50' : 'bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`p-2 rounded-lg text-white ${getNotificationBadgeColor(
                          notification.type
                        )}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-sm font-semibold ${!notification.isRead ? 'text-primary-text' : 'text-secondary-text'}`}>
                            {notification.title}
                          </h3>
                          <Badge className={`${getNotificationBadgeColor(notification.type)} text-white text-[10px] px-1.5 py-0.5`}>
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          {!notification.isRead && (
                            <Badge className="text-[10px] px-1.5 py-0.5" style={{ backgroundColor: iconBgColor, color: primaryColor }}>
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-secondary-text mb-2">{notification.message}</p>
                        <p className="text-[10px] text-muted-text">
                          {format(new Date(notification.createdAt), 'MMM dd, yyyy hh:mm a')}
                        </p>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="ml-4 px-2 py-1 rounded transition-colors text-xs font-medium h-7"
                        style={{ backgroundColor: iconBgColor, color: primaryColor }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = iconBgColor;
                        }}
                      >
                        <Check className="w-3.5 h-3.5 inline mr-1" />
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

