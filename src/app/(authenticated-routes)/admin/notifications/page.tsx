'use client';

import { useState, useEffect } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

      const response = await fetch(`/api/notifications?${params.toString()}`);
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
      const response = await fetch('/api/users');
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

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-primary-text">
            <Bell className="h-8 w-8" style={{ color: primaryColor }} />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-secondary-text">
            Manage system notifications and announcements
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Notification
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-text" />
              <Input
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="course">Course</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="alert">Alert</SelectItem>
              <SelectItem value="grade">Grade</SelectItem>
              <SelectItem value="result">Result</SelectItem>
              <SelectItem value="assessment">Assessment</SelectItem>
            </SelectContent>
          </Select>
          <Select value={readFilter} onValueChange={setReadFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No notifications found
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification) => (
                <TableRow
                  key={notification.id}
                  style={{
                    backgroundColor: !notification.isRead 
                      ? isDarkMode ? 'rgba(38, 40, 149, 0.1)' : 'rgba(38, 40, 149, 0.05)'
                      : 'transparent',
                  }}
                >
                  <TableCell className="font-medium">
                    {notification.title}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {notification.message}
                  </TableCell>
                  <TableCell>{getTypeBadge(notification.type)}</TableCell>
                  <TableCell>
                    {notification.user.first_name} {notification.user.last_name}
                    <br />
                    <span className="text-xs text-muted-text">
                      {notification.user.email} ({notification.user.role})
                    </span>
                  </TableCell>
                  <TableCell>
                    {notification.isRead ? (
                      <Badge variant="secondary">Read</Badge>
                    ) : (
                      <Badge variant="default">Unread</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(notification.createdAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!notification.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(notification)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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
              <Label htmlFor="userId">Recipient *</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) =>
                  setFormData({ ...formData, userId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.first_name} {user.last_name} ({user.email}) -{' '}
                      {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: notification_type) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="grade">Grade</SelectItem>
                  <SelectItem value="result">Result</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter notification title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message *</Label>
              <Input
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Enter notification message"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Notification'
              )}
            </Button>
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
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

