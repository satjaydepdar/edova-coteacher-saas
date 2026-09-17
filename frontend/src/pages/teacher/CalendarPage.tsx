import React, { useEffect, useMemo, useState } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import {
  CalendarEventItem,
  EventKind,
  useCalendarStore,
} from '../../store/calendarStore'

const EVENT_KIND_STYLES: Record<
  EventKind,
  { label: string; badgeCls: string; dotCls: string }
> = {
  class: {
    label: 'Class',
    badgeCls: 'bg-[#13231F]/10 text-[#13231F] border border-[#13231F]/20',
    dotCls: 'bg-[#13231F]',
  },
  exam: {
    label: 'Exam',
    badgeCls: 'bg-[#E5484D]/15 text-[#E5484D] border border-[#E5484D]/30',
    dotCls: 'bg-[#E5484D]',
  },
  homework: {
    label: 'Homework Due',
    badgeCls: 'bg-[#D9A94E]/20 text-[#8A6A2E] border border-[#D9A94E]/40',
    dotCls: 'bg-[#D9A94E]',
  },
  holiday: {
    label: 'Holiday',
    badgeCls: 'bg-[#7FBF7A]/25 text-[#1E5622] border border-[#7FBF7A]/40',
    dotCls: 'bg-[#7FBF7A]',
  },
  meeting: {
    label: 'Meeting',
    badgeCls: 'bg-black/5 text-[#13231F] border border-black/15',
    dotCls: 'bg-[#1E352E]',
  },
}

export default function CalendarPage() {
  const { events, fetchEvents, addEvent, deleteEvent } = useCalendarStore()
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null)

  // Form state for creating a new event
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventType, setNewEventType] = useState<EventKind>('class')
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().slice(0, 10))
  const [newEventStartTime, setNewEventStartTime] = useState('09:00')
  const [newEventEndTime, setNewEventEndTime] = useState('10:00')
  const [newEventDesc, setNewEventDesc] = useState('')
  const [newEventLocation, setNewEventLocation] = useState('')
  const [newEventAllDay, setNewEventAllDay] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Month navigation helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1))
    } else if (viewMode === 'week') {
      const next = new Date(currentDate)
      next.setDate(next.getDate() - 7)
      setCurrentDate(next)
    } else {
      const next = new Date(currentDate)
      next.setDate(next.getDate() - 1)
      setCurrentDate(next)
    }
  }

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1))
    } else if (viewMode === 'week') {
      const next = new Date(currentDate)
      next.setDate(next.getDate() + 7)
      setCurrentDate(next)
    } else {
      const next = new Date(currentDate)
      next.setDate(next.getDate() + 1)
      setCurrentDate(next)
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Generate calendar days for month view
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay()
    const lastDate = new Date(year, month + 1, 0).getDate()
    const prevLastDate = new Date(year, month, 0).getDate()

    const days: { date: Date; isCurrentMonth: boolean; dateKey: string }[] = []

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevLastDate - i)
      days.push({
        date: d,
        isCurrentMonth: false,
        dateKey: d.toISOString().slice(0, 10),
      })
    }

    // Current month days
    for (let i = 1; i <= lastDate; i++) {
      const d = new Date(year, month, i)
      days.push({
        date: d,
        isCurrentMonth: true,
        dateKey: d.toISOString().slice(0, 10),
      })
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({
        date: d,
        isCurrentMonth: false,
        dateKey: d.toISOString().slice(0, 10),
      })
    }

    return days
  }, [year, month])

  // Events indexed by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEventItem[]> = {}
    events.forEach((ev) => {
      const key = ev.start_at.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(ev)
    })
    return map
  }, [events])

  const todayKey = new Date().toISOString().slice(0, 10)

  const handleOpenAddModal = (initialDate?: string) => {
    if (initialDate) {
      setNewEventDate(initialDate)
    }
    setIsAddModalOpen(true)
  }

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventTitle.trim()) return

    const startIso = newEventAllDay
      ? `${newEventDate}T00:00:00Z`
      : `${newEventDate}T${newEventStartTime}:00Z`

    const endIso = newEventAllDay
      ? undefined
      : `${newEventDate}T${newEventEndTime}:00Z`

    await addEvent({
      title: newEventTitle.trim(),
      description: newEventDesc.trim(),
      event_type: newEventType,
      start_at: startIso,
      end_at: endIso,
      all_day: newEventAllDay,
      location: newEventLocation.trim(),
    })

    // Reset form
    setNewEventTitle('')
    setNewEventDesc('')
    setNewEventLocation('')
    setIsAddModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#FBF7EE] text-[#13231F] font-[Inter] p-6 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#13231F] flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-[#7FBF7A]" />
            My Calendar
          </h1>
          <p className="text-[14px] text-black/60 mt-1">
            Teaching schedule, examinations, assignments due, and meetings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="flex items-center bg-[#F5F1E6] p-1 rounded-xl border border-[#E8E0CC]">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-forest text-white shadow-xs'
                    : 'text-black/60 hover:text-[#13231F]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button
            variant="default"
            size="default"
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </Button>
        </div>
      </div>

      {/* Toolbar: Navigation and Month Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FCFBF8] p-4 rounded-2xl border border-[#E8E0CC] shadow-xs">
        <div className="flex items-center gap-3">
          <h2 className="text-lg lg:text-xl font-bold text-[#13231F]">
            {monthName}
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={goToToday}
            className="border border-[#E8E0CC] text-xs font-semibold"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevPeriod}
            className="w-8 h-8 p-0 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPeriod}
            className="w-8 h-8 p-0 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend Indicator */}
      <div className="flex flex-wrap items-center gap-3 px-1 text-xs">
        <span className="text-black/50 font-medium">Categories:</span>
        {(Object.keys(EVENT_KIND_STYLES) as EventKind[]).map((kind) => {
          const conf = EVENT_KIND_STYLES[kind]
          return (
            <div key={kind} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${conf.dotCls}`} />
              <span className="text-black/70 font-medium">{conf.label}</span>
            </div>
          )
        })}
      </div>

      {/* Main Calendar View: Month Grid */}
      {viewMode === 'month' && (
        <div className="bg-[#FCFBF8] rounded-2xl border border-[#E8E0CC] shadow-xs overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-[#E8E0CC] bg-[#F5F1E6]/70 text-center py-2.5 text-xs font-semibold text-black/60">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Day Cells Matrix */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#E8E0CC]">
            {calendarDays.map((cell, idx) => {
              const isToday = cell.dateKey === todayKey
              const dayEvents = eventsByDate[cell.dateKey] || []

              return (
                <div
                  key={idx}
                  onClick={() => handleOpenAddModal(cell.dateKey)}
                  className={`min-h-[110px] sm:min-h-[130px] p-2 flex flex-col justify-between transition-colors group cursor-pointer ${
                    cell.isCurrentMonth
                      ? 'bg-[#FCFBF8] hover:bg-[#F5F1E6]/50'
                      : 'bg-[#F9F6EE]/50 text-black/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 text-xs font-semibold rounded-full transition-all ${
                        isToday
                          ? 'bg-forest text-white shadow-xs font-bold'
                          : cell.isCurrentMonth
                          ? 'text-[#13231F] group-hover:bg-[#E8E0CC]/50'
                          : 'text-black/35'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono text-black/40">
                        {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                      </span>
                    )}
                  </div>

                  {/* Event Chips */}
                  <div className="space-y-1 mt-1.5 flex-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const conf = EVENT_KIND_STYLES[ev.event_type] || EVENT_KIND_STYLES.class
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedEvent(ev)
                          }}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium truncate cursor-pointer transition-transform hover:scale-[1.02] ${conf.badgeCls}`}
                        >
                          {ev.title}
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-black/50 font-medium pl-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Week / Day View List Fallback */}
      {viewMode !== 'month' && (
        <div className="bg-[#FCFBF8] rounded-2xl border border-[#E8E0CC] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E0CC] pb-3">
            <h3 className="font-bold text-lg text-[#13231F]">
              Scheduled Entries for {currentDate.toLocaleDateString()}
            </h3>
            <span className="text-xs text-black/50">
              {eventsByDate[currentDate.toISOString().slice(0, 10)]?.length || 0} events
            </span>
          </div>

          <div className="space-y-3">
            {(eventsByDate[currentDate.toISOString().slice(0, 10)] || []).length === 0 ? (
              <div className="text-center py-12 text-black/40 text-sm">
                No events scheduled for this date. Click "+ Add Event" to create one.
              </div>
            ) : (
              (eventsByDate[currentDate.toISOString().slice(0, 10)] || []).map((ev) => {
                const conf = EVENT_KIND_STYLES[ev.event_type] || EVENT_KIND_STYLES.class
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="p-4 rounded-xl border border-[#E8E0CC] bg-[#F5F1E6]/40 hover:bg-[#F5F1E6] transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${conf.badgeCls}`}>
                          {conf.label}
                        </span>
                        <h4 className="font-semibold text-[14px] text-[#13231F]">{ev.title}</h4>
                      </div>
                      {ev.description && (
                        <p className="text-xs text-black/60">{ev.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-black/50 mt-2">
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {ev.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ev.all_day ? 'All day' : new Date(ev.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Add Event Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#FCFBF8] border border-[#E8E0CC] w-full max-w-lg rounded-2xl shadow-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E0CC] pb-3">
              <h3 className="font-bold text-lg text-[#13231F]">Add Calendar Entry</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-black/40 hover:text-[#13231F] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-[13px]">
              <div>
                <label className="block font-semibold mb-1 text-[#13231F]">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10A Period - Algebra"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E8E0CC] bg-white text-[#13231F] focus:outline-none focus:border-[#7FBF7A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#13231F]">
                    Category
                  </label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as EventKind)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E8E0CC] bg-white text-[#13231F] focus:outline-none focus:border-[#7FBF7A]"
                  >
                    <option value="class">Class</option>
                    <option value="exam">Exam</option>
                    <option value="homework">Homework Due</option>
                    <option value="holiday">Holiday</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#13231F]">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E8E0CC] bg-white text-[#13231F] focus:outline-none focus:border-[#7FBF7A]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={newEventAllDay}
                  onChange={(e) => setNewEventAllDay(e.target.checked)}
                  className="rounded border-[#E8E0CC] text-[#13231F] focus:ring-[#7FBF7A]"
                />
                <label htmlFor="allDay" className="text-xs text-black/70 cursor-pointer">
                  All-day event
                </label>
              </div>

              {!newEventAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-[#13231F]">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newEventStartTime}
                      onChange={(e) => setNewEventStartTime(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#E8E0CC] bg-white text-[#13231F] focus:outline-none focus:border-[#7FBF7A]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-[#13231F]">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newEventEndTime}
                      onChange={(e) => setNewEventEndTime(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#E8E0CC] bg-white text-[#13231F] focus:outline-none focus:border-[#7FBF7A]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-[#13231F]">
                  Location / Room (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 204 or Physics Lab"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E8E0CC] bg-white text-[#13231F] focus:outline-none focus:border-[#7FBF7A]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#13231F]">
                  Notes / Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional context or lesson topic..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E8E0CC] bg-white text-[#13231F] focus:outline-none focus:border-[#7FBF7A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E0CC]">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="default">
                  Save Entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#FCFBF8] border border-[#E8E0CC] w-full max-w-md rounded-2xl shadow-card p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider mb-1.5"
                >
                  {(EVENT_KIND_STYLES[selectedEvent.event_type] || EVENT_KIND_STYLES.class).label}
                </span>
                <h3 className="font-bold text-lg text-[#13231F]">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-black/40 hover:text-[#13231F] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedEvent.description && (
              <p className="text-[13.5px] text-black/70 bg-[#F5F1E6] p-3 rounded-xl border border-[#E8E0CC]">
                {selectedEvent.description}
              </p>
            )}

            <div className="space-y-2 text-xs text-black/60 pt-2 border-t border-[#E8E0CC]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-black/40" />
                <span>
                  {new Date(selectedEvent.start_at).toLocaleDateString()}{' '}
                  {!selectedEvent.all_day &&
                    '· ' +
                    new Date(selectedEvent.start_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                </span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-black/40" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E8E0CC]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  deleteEvent(selectedEvent.id)
                  setSelectedEvent(null)
                }}
                className="text-[#E5484D] hover:bg-[#E5484D]/10 border-[#E5484D]/30"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
