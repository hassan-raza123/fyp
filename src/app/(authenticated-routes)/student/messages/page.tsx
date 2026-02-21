'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
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
import Link from 'next/link';

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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<MessagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

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
        return 'bg-[var(--brand-primary-opacity-10)] text-[var(--blue)] dark:bg-[var(--brand-secondary-opacity-10)] dark:text-[var(--orange)] border border-card-border';
      case 'course':
        return 'bg-[var(--success-green-opacity-10)] text-[var(--success-green)] border border-card-border';
      case 'assessment':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-card-border';
      case 'grade':
        return 'bg-[var(--brand-secondary-opacity-10)] text-[var(--orange)] dark:text-[var(--orange)] border border-card-border';
      case 'system':
        return 'bg-hover-bg text-primary-text border border-card-border';
      default:
        return 'bg-hover-bg text-primary-text border border-card-border';
    }
  };

  if (!mounted || (loading && !data)) {
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
          <p className="text-xs text-secondary-text">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <MessageSquare className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">Messages & Announcements</h1>
            <p className="text-xs text-secondary-text mt-0.5">View messages and updates</p>
          </div>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-4">
          <p className="text-sm text-primary-text">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Header - admin CLO style with icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <MessageSquare className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">Messages & Announcements</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              View messages from faculty, course announcements, and system updates
            </p>
          </div>
        </div>
        {data.summary.unread > 0 && (
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
            Mark All as Read ({data.summary.unread})
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-secondary-text">Total Messages</p>
          <div className="text-xl font-bold mt-1 text-primary-text">{data.summary.total}</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-secondary-text">Unread</p>
          <div className="text-xl font-bold mt-1 text-primary-text" style={{ color: primaryColor }}>{data.summary.unread}</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-secondary-text">Course Messages</p>
          <div className="text-xl font-bold mt-1 text-primary-text">{data.summary.course}</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-secondary-text">Announcements</p>
          <div className="text-xl font-bold mt-1 text-primary-text">{data.summary.announcements}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="p-4 border-b border-card-border">
          <h2 className="text-sm font-semibold text-primary-text">Filters</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-primary-text">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-text" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-primary-text">Filter by Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Types</SelectItem>
                  <SelectItem value="announcement" className="text-primary-text hover:bg-card/50">Announcements</SelectItem>
                  <SelectItem value="course" className="text-primary-text hover:bg-card/50">Course Messages</SelectItem>
                  <SelectItem value="assessment" className="text-primary-text hover:bg-card/50">Assessments</SelectItem>
                  <SelectItem value="grade" className="text-primary-text hover:bg-card/50">Grades</SelectItem>
                  <SelectItem value="system" className="text-primary-text hover:bg-card/50">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-primary-text">Filter by Course</label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Courses</SelectItem>
                  {data.courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()} className="text-primary-text hover:bg-card/50">
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
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

      {/* Messages List */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="p-4 border-b border-card-border">
          <h2 className="text-sm font-semibold text-primary-text">Messages</h2>
        </div>
        <div className="p-4">
          {data.messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-text opacity-50" />
              <p className="text-xs text-secondary-text">No messages found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border border-card-border ${
                    message.isRead ? 'bg-hover-bg/50' : 'bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${getCategoryColor(message.category)}`}>
                        {getCategoryIcon(message.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-sm font-semibold ${!message.isRead ? 'text-primary-text' : 'text-secondary-text'}`}>
                            {message.title}
                          </h3>
                          <Badge className="border border-card-border text-[10px] px-1.5 py-0.5 text-primary-text">
                            {message.category}
                          </Badge>
                          {!message.isRead && (
                            <Badge className="text-[10px] px-1.5 py-0.5" style={{ backgroundColor: iconBgColor, color: primaryColor }}>
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-secondary-text mb-2">{message.message}</p>
                        <div className="flex items-center gap-4 text-[10px] text-muted-text">
                          <span>{format(new Date(message.createdAt), 'MMM dd, yyyy hh:mm a')}</span>
                          {message.relatedCourse && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              <span>{message.relatedCourse.code} - {message.relatedCourse.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {!message.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(message.id)}
                        className="ml-4 px-2 py-1 rounded text-xs font-medium hover:bg-hover-bg text-primary-text"
                        style={{ color: primaryColor }}
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
};

export default MessagesPage;

