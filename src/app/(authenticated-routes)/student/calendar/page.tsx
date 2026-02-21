'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Clock,
  BookOpen,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { Link } from 'next/link';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'assessment' | 'semester' | 'announcement';
  category: 'assessment' | 'exam' | 'semester' | 'announcement';
  course?: {
    code: string;
    name: string;
  };
  semester?: string;
  assessmentId?: number;
  assessmentType?: string;
  totalMarks?: number;
  startTime?: string | null;
  endTime?: string | null;
  allDay?: boolean;
}

interface CalendarData {
  events: CalendarEvent[];
  summary: {
    total: number;
    assessments: number;
    exams: number;
    semesterEvents: number;
  };
}

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchCalendarEvents();
  }, [currentDate, view]);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      let startDate: Date;
      let endDate: Date;

      if (view === 'month') {
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
      } else if (view === 'week') {
        startDate = startOfWeek(currentDate);
        endDate = endOfWeek(currentDate);
      } else {
        startDate = currentDate;
        endDate = currentDate;
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(`/api/student/calendar?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch calendar events');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch calendar events');
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    if (!data) return [];
    return data.events.filter((event) => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  const getEventColor = (category: string) => {
    switch (category) {
      case 'exam':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'assessment':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'semester':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'announcement':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'assessment':
        return <FileText className="w-4 h-4" />;
      case 'semester':
        return <GraduationCap className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) =>
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center font-semibold text-sm p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] border rounded-lg p-2 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-blue-600 font-bold' : ''}`}
                >
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getEventColor(
                        event.category
                      )}`}
                      title={event.title}
                    >
                      <div className="flex items-center gap-1 truncate">
                        {getEventIcon(event.type)}
                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(currentDate),
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div key={day.toISOString()} className="space-y-2">
                <div
                  className={`text-center p-2 rounded ${
                    isToday ? 'bg-blue-100 font-bold' : 'bg-gray-100'
                  }`}
                >
                  <div className="text-sm">{format(day, 'EEE')}</div>
                  <div className="text-lg">{format(day, 'd')}</div>
                </div>
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <Card
                      key={event.id}
                      className={`cursor-pointer hover:shadow-md ${getEventColor(
                        event.category
                      )}`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          {getEventIcon(event.type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {event.title}
                            </p>
                            {event.course && (
                              <p className="text-xs opacity-75">
                                {event.course.code}
                              </p>
                            )}
                            {event.startTime && (
                              <p className="text-xs opacity-75 flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(event.startTime), 'hh:mm a')}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Day view
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-gray-100 rounded-lg">
          <div className="text-2xl font-bold">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
        <div className="space-y-3">
          {dayEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No events scheduled for this day
            </div>
          ) : (
            dayEvents.map((event) => (
              <Card
                key={event.id}
                className="cursor-pointer hover:shadow-md"
                onClick={() => setSelectedEvent(event)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${getEventColor(event.category)}`}
                    >
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge variant="outline">{event.category}</Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {event.description}
                        </p>
                      )}
                      {event.course && (
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <BookOpen className="w-4 h-4" />
                          <span>
                            {event.course.code} - {event.course.name}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            {format(new Date(event.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {event.startTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {format(new Date(event.startTime), 'hh:mm a')}
                              {event.endTime &&
                                ` - ${format(new Date(event.endTime), 'hh:mm a')}`}
                            </span>
                          </div>
                        )}
                        {event.totalMarks && (
                          <span>Total Marks: {event.totalMarks}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Academic Calendar</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            View your assessments, exams, and important dates
          </p>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-hover-bg"
        >
          Today
        </button>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {data.summary.assessments}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {data.summary.exams}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Semester Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {data.summary.semesterEvents}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Select value={view} onValueChange={(v: any) => setView(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-semibold min-w-[200px] text-center">
                  {view === 'month'
                    ? format(currentDate, 'MMMM yyyy')
                    : view === 'week'
                    ? `Week of ${format(startOfWeek(currentDate), 'MMM d')}`
                    : format(currentDate, 'MMMM d, yyyy')}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading calendar...</div>
          ) : view === 'month' ? (
            renderMonthView()
          ) : view === 'week' ? (
            renderWeekView()
          ) : (
            renderDayView()
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-w-2xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getEventIcon(selectedEvent.type)}
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription>
                  <Badge variant="outline" className="mt-2">
                    {selectedEvent.category}
                  </Badge>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedEvent.description && (
                  <div>
                    <h4 className="font-semibold mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-1">Date</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedEvent.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  {selectedEvent.startTime && (
                    <div>
                      <h4 className="font-semibold mb-1">Time</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedEvent.startTime), 'hh:mm a')}
                        {selectedEvent.endTime &&
                          ` - ${format(new Date(selectedEvent.endTime), 'hh:mm a')}`}
                      </p>
                    </div>
                  )}
                  {selectedEvent.course && (
                    <div>
                      <h4 className="font-semibold mb-1">Course</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.course.code} - {selectedEvent.course.name}
                      </p>
                    </div>
                  )}
                  {selectedEvent.semester && (
                    <div>
                      <h4 className="font-semibold mb-1">Semester</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.semester}
                      </p>
                    </div>
                  )}
                  {selectedEvent.totalMarks && (
                    <div>
                      <h4 className="font-semibold mb-1">Total Marks</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.totalMarks}
                      </p>
                    </div>
                  )}
                  {selectedEvent.assessmentType && (
                    <div>
                      <h4 className="font-semibold mb-1">Type</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.assessmentType.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                </div>
                {selectedEvent.assessmentId && (
                  <div className="pt-4 border-t">
                    <Link
                      href={`/student/assessments/${selectedEvent.assessmentId}`}
                    >
                      <Button variant="outline" className="w-full">
                        View Assessment Details
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;

