'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);

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
        return 'bg-blue-500';
      case 'grade':
        return 'bg-green-500';
      case 'result':
        return 'bg-purple-500';
      case 'course':
        return 'bg-orange-500';
      case 'alert':
        return 'bg-red-500';
      case 'announcement':
        return 'bg-indigo-500';
      case 'system':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
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

  if (loading && notifications.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with assessment, grade, and system notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotifications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unread
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {unreadCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessmentNotifications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Grades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradeNotifications}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="grade">Grade</SelectItem>
                  <SelectItem value="result">Result</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Status</label>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            {filteredNotifications.length} notification(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No notifications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.isRead
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-white border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`p-2 rounded-lg ${getNotificationBadgeColor(
                          notification.type
                        )} text-white`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`font-semibold ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={getNotificationBadgeColor(
                              notification.type
                            )}
                          >
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          {!notification.isRead && (
                            <Badge variant="default" className="bg-blue-500">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(notification.createdAt),
                            'MMM dd, yyyy hh:mm a'
                          )}
                        </p>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="ml-4"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

