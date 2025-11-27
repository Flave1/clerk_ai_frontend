import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Video, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import Head from 'next/head';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
  attendees: Array<{
    email: string;
    name?: string;
    response_status?: string;
  }>;
  attendee_count: number;
  join_url?: string;
  organizer?: string;
  is_online_meeting: boolean;
  color?: string;
  calendar_type: 'google' | 'microsoft';
}

interface DayEvent {
  event: CalendarEvent;
  startHour: number;
  endHour: number;
}

const CalendarPage = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedIntegration, setSelectedIntegration] = useState<'google_calendar' | 'microsoft_calendar'>('google_calendar');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);

  // Read integration from query params
  useEffect(() => {
    if (router.query.integration) {
      const integration = router.query.integration as string;
      if (integration === 'google_calendar' || integration === 'microsoft_calendar') {
        setSelectedIntegration(integration);
      }
    }
  }, [router.query.integration]);

  // Get month info
  const monthStart = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  }, [currentDate]);

  const monthName = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const firstDayOfWeek = monthStart.getDay();
    
    // Add previous month's days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(monthStart);
      day.setDate(day.getDate() - i - 1);
      days.push(day);
    }
    
    // Add current month's days
    for (let i = 1; i <= monthEnd.getDate(); i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    
    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows x 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(monthEnd);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    return days;
  }, [monthStart, monthEnd, currentDate]);

  // Fetch events
  useEffect(() => {
    fetchEvents();
  }, [currentDate, selectedIntegration]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        .toISOString().split('T')[0];
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        .toISOString().split('T')[0];
      
      const response = await apiClient.getCalendarEvents({
        integration_key: selectedIntegration,
        start_date: startDate,
        end_date: endDate,
      });
      
      setEvents(response.events);
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Calendar not connected');
      } else {
        toast.error('Failed to load calendar events');
      }
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date): CalendarEvent[] => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    return events.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      
      return (
        (eventStart >= dayStart && eventStart <= dayEnd) ||
        (eventEnd >= dayStart && eventEnd <= dayEnd) ||
        (eventStart <= dayStart && eventEnd >= dayEnd)
      );
    });
  };

  // Check if day is today
  const isToday = (day: Date): boolean => {
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };

  // Check if day is in current month
  const isCurrentMonth = (day: Date): boolean => {
    return day.getMonth() === currentDate.getMonth();
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle day click
  const handleDayClick = (day: Date) => {
    const dayEvents = getEventsForDay(day);
    setSelectedDay(day);
    setSelectedDayEvents(dayEvents);
    setShowEventModal(true);
  };

  // Format time
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <Head>
        <title>Calendar - Clerk</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-500 mt-1">View and manage your calendar events</p>
            </div>
            
            {/* Integration Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedIntegration('google_calendar')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedIntegration === 'google_calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <img src="/images/integrations/google_calendar.png" alt="Google Calendar" className="w-5 h-5" />
                  Google Calendar
                </div>
              </button>
              <button
                onClick={() => setSelectedIntegration('microsoft_calendar')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedIntegration === 'microsoft_calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <img src="/images/integrations/microsoft-calendar.png" alt="Outlook Calendar" className="w-5 h-5" />
                  Outlook Calendar
                </div>
              </button>
            </div>
          </div>

          {/* Calendar Controls */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">{monthName}</h2>
              </div>
              
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isTodayDay = isToday(day);
                const isCurrentMonthDay = isCurrentMonth(day);
                
                return (
                  <div
                    key={index}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[120px] p-2 border-b border-r border-gray-200 last:border-r-0 cursor-pointer transition-colors hover:bg-gray-50 ${
                      !isCurrentMonthDay ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isTodayDay 
                        ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center' 
                        : isCurrentMonthDay 
                          ? 'text-gray-900' 
                          : 'text-gray-400'
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    {/* Events Preview */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event, eventIndex) => (
                        <div
                          key={event.id}
                          className="text-xs px-2 py-1 rounded truncate"
                          style={{ backgroundColor: event.color || '#4285f4', color: 'white' }}
                          title={event.title}
                        >
                          {formatTime(event.start_time)} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {showEventModal && selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {formatDate(selectedDay)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'}
                  </p>
                </div>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {selectedDayEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No events on this day</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDayEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        style={{ borderLeftWidth: '4px', borderLeftColor: event.color || '#4285f4' }}
                      >
                        <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          {/* Time */}
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              {formatTime(event.start_time)} - {formatTime(event.end_time)}
                            </span>
                          </div>
                          
                          {/* Location */}
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          
                          {/* Attendees */}
                          {event.attendee_count > 0 && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{event.attendee_count} {event.attendee_count === 1 ? 'attendee' : 'attendees'}</span>
                            </div>
                          )}
                          
                          {/* Join URL */}
                          {event.join_url && (
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4" />
                              <a
                                href={event.join_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Join Meeting
                              </a>
                            </div>
                          )}
                          
                          {/* Organizer */}
                          {event.organizer && (
                            <div className="text-xs text-gray-500 mt-2">
                              Organized by {event.organizer}
                            </div>
                          )}
                        </div>
                        
                        {/* Description */}
                        {event.description && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">{event.description}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CalendarPage;

