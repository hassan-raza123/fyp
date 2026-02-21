'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  MessageSquare,
  Bell,
  BookOpen,
  AlertCircle,
  FileText,
  Award,
  Check,
  CheckCheck,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'next/link';

interface Message {
  id: number;
  title: string;
  message: string;
  type: string;
  category: 'announcement' | 'course' | 'system' | 'assessment' | 'grade';
  isRead: boolean;
  createdAt: string;
  relatedCourse: {
    id: number;
    code: string;
    name: string;
  } | null;
}

interface MessagesData {
  messages: Message[];
  summary: {
    total: number;
    unread: number;
    announcements: number;
    course: number;
    system: number;
    assessment: number;
    grade: number;
  };
  courses: Array<{
    id: number;
    code: string;
    name: string;
  }>;
}

const MessagesPage = () => {
  const [data, setData] = useState<MessagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [typeFilter, courseFilter, readFilter, searchQuery]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (courseFilter !== 'all') {
        params.append('courseId', courseFilter);
      }
      if (readFilter !== 'all') {
        params.append('isRead', readFilter === 'read' ? 'true' : 'false');
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(
        `/api/student/messages?${params.toString()}`,
        {
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error('Failed to fetch messages');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch messages');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load messages'
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      const response = await fetch(`/api/notifications/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) throw new Error('Failed to update message');
      fetchMessages();
      toast.success('Message marked as read');
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (!data) return;
      const unreadMessages = data.messages.filter((m) => !m.isRead);
      await Promise.all(
        unreadMessages.map((m) =>
          fetch(`/api/notifications/${m.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ isRead: true }),
          })
        )
      );
      fetchMessages();
      toast.success('All messages marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'announcement':
        return <Bell className="w-5 h-5" />;
      case 'course':
        return <BookOpen className="w-5 h-5" />;
      case 'assessment':
        return <FileText className="w-5 h-5" />;
      case 'grade':
        return <Award className="w-5 h-5" />;
      case 'system':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'announcement':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'course':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'assessment':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'grade':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'system':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Messages & Announcements</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            View messages from faculty, course announcements, and system updates
          </p>
        </div>
        {data.summary.unread > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 flex items-center gap-1.5 border border-card-border bg-transparent text-primary-text hover:bg-hover-bg"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark All as Read ({data.summary.unread})
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total}</div>
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
              {data.summary.unread}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Course Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.course}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.announcements}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="announcement">Announcements</SelectItem>
                  <SelectItem value="course">Course Messages</SelectItem>
                  <SelectItem value="assessment">Assessments</SelectItem>
                  <SelectItem value="grade">Grades</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Course</label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {data.courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
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

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {data.messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No messages found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border ${
                    message.isRead
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-white border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`p-2 rounded-lg ${getCategoryColor(
                          message.category
                        )}`}
                      >
                        {getCategoryIcon(message.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`font-semibold ${
                              !message.isRead ? 'text-gray-900' : 'text-gray-600'
                            }`}
                          >
                            {message.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {message.category}
                          </Badge>
                          {!message.isRead && (
                            <Badge variant="default" className="bg-blue-500 text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {message.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {format(
                              new Date(message.createdAt),
                              'MMM dd, yyyy hh:mm a'
                            )}
                          </span>
                          {message.relatedCourse && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              <span>
                                {message.relatedCourse.code} -{' '}
                                {message.relatedCourse.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {!message.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(message.id)}
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
};

export default MessagesPage;

