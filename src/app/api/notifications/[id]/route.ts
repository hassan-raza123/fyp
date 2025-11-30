import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const notificationId = parseInt(id);
    const body = await request.json();
    const { isRead } = body;

    // Check if user owns this notification or is admin
    const notification = await prisma.notifications.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (user?.role !== 'admin' && notification.userId !== user?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updatedNotification = await prisma.notifications.update({
      where: { id: notificationId },
      data: {
        isRead: isRead !== undefined ? isRead : notification.isRead,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully',
      data: updatedNotification,
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user, error } = await requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const notificationId = parseInt(id);

    await prisma.notifications.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

