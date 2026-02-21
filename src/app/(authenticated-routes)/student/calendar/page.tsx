'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
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
import Link from 'next/link';

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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

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
        return 'bg-[var(--error-opacity-10)] text-[var(--error)] border border-[var(--error)]/30';
      case 'assessment':
        return 'bg-[var(--brand-primary-opacity-10)] text-[var(--blue)] dark:bg-[var(--brand-secondary-opacity-10)] dark:text-[var(--orange)] border border-card-border';
      case 'semester':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30';
      case 'announcement':
        return 'bg-[var(--success-green-opacity-10)] text-[var(--success-green)] border border-[var(--success-green)]/30';
      default:
        return 'bg-hover-bg text-primary-text border border-card-border';
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
            <div key={day} className="text-center font-semibold text-xs p-2 text-primary-text">
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
                className={`min-h-[100px] border rounded-lg p-2 border-card-border ${
                  isCurrentMonth ? 'bg-card' : 'bg-card/50'
                }`}
                style={isToday ? { boxShadow: `0 0 0 2px ${primaryColor}` } : undefined}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-primary-text' : 'text-muted-text'
                  } ${isToday ? 'font-bold' : ''}`}
                  style={isToday ? { color: primaryColor } : undefined}
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
                    <div className="text-xs text-muted-text">
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
                  className={`text-center p-2 rounded text-primary-text ${
                    isToday ? 'font-bold' : ''
                  }`}
                  style={isToday ? { backgroundColor: iconBgColor, color: primaryColor } : { backgroundColor: 'var(--hover-bg)' }}
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
        <div className="text-center p-4 rounded-lg border border-card-border bg-card">
          <div className="text-xl font-bold text-primary-text">
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
          className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 transition-colors"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = iconBgColor;
          }}
        >
          Today
        </button>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-secondary-text">Total Events</p>
            <div className="text-xl font-bold mt-1 text-primary-text">{data.summary.total}</div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-secondary-text">Assessments</p>
            <div className="text-xl font-bold mt-1 text-primary-text" style={{ color: primaryColor }}>{data.summary.assessments}</div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-secondary-text">Exams</p>
            <div className="text-xl font-bold mt-1 text-[var(--error)]">{data.summary.exams}</div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-secondary-text">Semester Events</p>
            <div className="text-xl font-bold mt-1 text-primary-text">{data.summary.semesterEvents}</div>
          </div>
        </div>
      )}

      {/* View Controls */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="p-4 border-b border-card-border">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Select value={view} onValueChange={(v: any) => setView(v)}>
                <SelectTrigger className="w-32 h-8 text-xs bg-card border-card-border text-primary-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="month" className="text-primary-text hover:bg-card/50">Month</SelectItem>
                  <SelectItem value="week" className="text-primary-text hover:bg-card/50">Week</SelectItem>
                  <SelectItem value="day" className="text-primary-text hover:bg-card/50">Day</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-hover-bg transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-sm font-semibold min-w-[200px] text-center text-primary-text">
                  {view === 'month'
                    ? format(currentDate, 'MMMM yyyy')
                    : view === 'week'
                    ? `Week of ${format(startOfWeek(currentDate), 'MMM d')}`
                    : format(currentDate, 'MMMM d, yyyy')}
                </div>
                <button
                  type="button"
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-hover-bg transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }}
              />
              <span className="text-xs text-secondary-text ml-2">Loading calendar...</span>
            </div>
          ) : view === 'month' ? (
            renderMonthView()
          ) : view === 'week' ? (
            renderWeekView()
          ) : (
            renderDayView()
          )}
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-w-2xl bg-card border-card-border">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm font-bold text-primary-text">
                  {getEventIcon(selectedEvent.type)}
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-secondary-text">
                  <Badge variant="outline" className="mt-2 border-card-border text-primary-text">
                    {selectedEvent.category}
                  </Badge>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedEvent.description && (
                  <div>
                    <h4 className="text-xs font-semibold mb-1 text-primary-text">Description</h4>
                    <p className="text-sm text-secondary-text">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold mb-1 text-primary-text">Date</h4>
                    <p className="text-sm text-secondary-text">
                      {format(new Date(selectedEvent.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  {selectedEvent.startTime && (
                    <div>
                      <h4 className="text-xs font-semibold mb-1 text-primary-text">Time</h4>
                      <p className="text-sm text-secondary-text">
                        {format(new Date(selectedEvent.startTime), 'hh:mm a')}
                        {selectedEvent.endTime &&
                          ` - ${format(new Date(selectedEvent.endTime), 'hh:mm a')}`}
                      </p>
                    </div>
                  )}
                  {selectedEvent.course && (
                    <div>
                      <h4 className="text-xs font-semibold mb-1 text-primary-text">Course</h4>
                      <p className="text-sm text-secondary-text">
                        {selectedEvent.course.code} - {selectedEvent.course.name}
                      </p>
                    </div>
                  )}
                  {selectedEvent.semester && (
                    <div>
                      <h4 className="text-xs font-semibold mb-1 text-primary-text">Semester</h4>
                      <p className="text-sm text-secondary-text">
                        {selectedEvent.semester}
                      </p>
                    </div>
                  )}
                  {selectedEvent.totalMarks && (
                    <div>
                      <h4 className="text-xs font-semibold mb-1 text-primary-text">Total Marks</h4>
                      <p className="text-sm text-secondary-text">
                        {selectedEvent.totalMarks}
                      </p>
                    </div>
                  )}
                  {selectedEvent.assessmentType && (
                    <div>
                      <h4 className="text-xs font-semibold mb-1 text-primary-text">Type</h4>
                      <p className="text-sm text-secondary-text">
                        {selectedEvent.assessmentType.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                </div>
                {selectedEvent.assessmentId && (
                  <div className="pt-4 border-t border-card-border">
                    <Link
                      href={`/student/assessments/${selectedEvent.assessmentId}`}
                    >
                      <Button variant="outline" className="w-full border-card-border text-primary-text hover:bg-hover-bg">
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

