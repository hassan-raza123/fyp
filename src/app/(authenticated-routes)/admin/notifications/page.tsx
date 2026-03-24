'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Trash2,
  Bell,
  Check,
  Loader2,
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
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export default function NotificationsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    title: '',
    message: '',
    type: '' as notification_type | '',
  });
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchNotifications();
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
      const data = await response.json();
      if (data.success) {
        let notificationsData = data.data;
        
        // Filter by search
        if (search) {
          const searchLower = search.toLowerCase();
          notificationsData = notificationsData.filter(
            (n: Notification) =>
              n.title.toLowerCase().includes(searchLower) ||
              n.message.toLowerCase().includes(searchLower) ||
              n.user.first_name.toLowerCase().includes(searchLower) ||
              n.user.last_name.toLowerCase().includes(searchLower)
          );
        }
        
        setNotifications(notificationsData);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.userId || !formData.title || !formData.message || !formData.type) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch('/api/notifications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(formData.userId),
          title: formData.title,
          message: formData.message,
          type: formData.type,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create notification');
      }

      toast.success('Notification created successfully');
      setIsCreateDialogOpen(false);
      setFormData({
        userId: '',
        title: '',
        message: '',
        type: '',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create notification'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update notification');
      }

      toast.success('Notification marked as read');
      fetchNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
      toast.error('Failed to update notification');
    }
  };

  const handleDeleteClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;

    try {
      const response = await fetch(`/api/notifications/${selectedNotification.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete notification');
      }

      toast.success('Notification deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedNotification(null);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete notification'
      );
    }
  };

  const getTypeBadge = (type: notification_type) => {
    switch (type) {
      case 'system':
        return <Badge variant="default">System</Badge>;
      case 'course':
        return <Badge variant="default">Course</Badge>;
      case 'announcement':
        return <Badge variant="default">Announcement</Badge>;
      case 'alert':
        return <Badge variant="destructive">Alert</Badge>;
      case 'grade':
        return <Badge variant="default">Grade</Badge>;
      case 'result':
        return <Badge variant="default">Result</Badge>;
      case 'assessment':
        return <Badge variant="default">Assessment</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!mounted) {
    return null;
  }

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage system notifications and announcements
          </p>
        </div>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = iconBgColor;
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Create Notification
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text"
            />
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Types</SelectItem>
            <SelectItem value="system" className="text-primary-text hover:bg-card/50">System</SelectItem>
            <SelectItem value="course" className="text-primary-text hover:bg-card/50">Course</SelectItem>
            <SelectItem value="announcement" className="text-primary-text hover:bg-card/50">Announcement</SelectItem>
            <SelectItem value="alert" className="text-primary-text hover:bg-card/50">Alert</SelectItem>
            <SelectItem value="grade" className="text-primary-text hover:bg-card/50">Grade</SelectItem>
            <SelectItem value="result" className="text-primary-text hover:bg-card/50">Result</SelectItem>
            <SelectItem value="assessment" className="text-primary-text hover:bg-card/50">Assessment</SelectItem>
          </SelectContent>
        </Select>
        <Select value={readFilter} onValueChange={setReadFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All</SelectItem>
            <SelectItem value="unread" className="text-primary-text hover:bg-card/50">Unread</SelectItem>
            <SelectItem value="read" className="text-primary-text hover:bg-card/50">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">Title</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Message</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Type</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Recipient</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Created At</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-xs text-secondary-text">Loading...</p>
                </TableCell>
              </TableRow>
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-xs text-secondary-text">No notifications found</p>
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification) => (
                <TableRow
                  key={notification.id}
                  className="hover:bg-hover-bg transition-colors"
                  style={{
                    backgroundColor: !notification.isRead
                      ? isDarkMode ? 'rgba(38, 40, 149, 0.1)' : 'rgba(38, 40, 149, 0.05)'
                      : undefined,
                  }}
                >
                  <TableCell className="text-xs font-medium text-primary-text">
                    {notification.title}
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text max-w-xs truncate">
                    {notification.message}
                  </TableCell>
                  <TableCell>{getTypeBadge(notification.type)}</TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {notification.user.first_name} {notification.user.last_name}
                    <br />
                    <span className="text-[10px] text-muted-text">
                      {notification.user.email} ({notification.user.role})
                    </span>
                  </TableCell>
                  <TableCell>
                    {notification.isRead ? (
                      <Badge className="bg-[var(--gray-500)] text-white text-[10px] px-1.5 py-0.5" variant="secondary">Read</Badge>
                    ) : (
                      <Badge className="bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5" variant="secondary">Unread</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {format(new Date(notification.createdAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                          style={{ backgroundColor: iconBgColor, color: primaryColor }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = iconBgColor; }}
                          title="Mark as read"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(notification)}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{ backgroundColor: 'var(--error-opacity-10)', color: 'var(--error)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-opacity-20)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-opacity-10)'; }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Notification Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Notification</DialogTitle>
            <DialogDescription>
              Send a notification to a specific user
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="userId" className="text-xs text-primary-text">Recipient *</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) =>
                  setFormData({ ...formData, userId: value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()} className="text-primary-text hover:bg-card/50">
                      {user.first_name} {user.last_name} ({user.email}) -{' '}
                      {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type" className="text-xs text-primary-text">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: notification_type) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="system" className="text-primary-text hover:bg-card/50">System</SelectItem>
                  <SelectItem value="course" className="text-primary-text hover:bg-card/50">Course</SelectItem>
                  <SelectItem value="announcement" className="text-primary-text hover:bg-card/50">Announcement</SelectItem>
                  <SelectItem value="alert" className="text-primary-text hover:bg-card/50">Alert</SelectItem>
                  <SelectItem value="grade" className="text-primary-text hover:bg-card/50">Grade</SelectItem>
                  <SelectItem value="result" className="text-primary-text hover:bg-card/50">Result</SelectItem>
                  <SelectItem value="assessment" className="text-primary-text hover:bg-card/50">Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-xs text-primary-text">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter notification title"
                required
                className="bg-card border-card-border text-primary-text"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message" className="text-xs text-primary-text">Message *</Label>
              <Input
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Enter notification message"
                required
                className="bg-card border-card-border text-primary-text"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{ color: isDarkMode ? '#ffffff' : '#111827', borderColor: isDarkMode ? '#404040' : '#e5e7eb' }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
              style={{ backgroundColor: iconBgColor, color: primaryColor }}
              onMouseEnter={(e) => { if (!isCreating) e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = iconBgColor; }}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Notification'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Notification Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notification</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedNotification?.title}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{ color: isDarkMode ? '#ffffff' : '#111827', borderColor: isDarkMode ? '#404040' : '#e5e7eb' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
              style={{ backgroundColor: 'var(--error-opacity-10)', color: 'var(--error)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-opacity-20)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-opacity-10)'; }}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

