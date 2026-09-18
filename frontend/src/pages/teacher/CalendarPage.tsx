import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import PageHeader from '../../components/PageHeader'
import SearchToolbar from '../../components/SearchToolbar'
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
    badgeCls: 'bg-[#F3F1EB] text-[#374151] border border-[#E5E0D5]',
    dotCls: 'bg-[#11181C]',
  },
  exam: {
    label: 'Exam',
    badgeCls: 'bg-[#FFE4E6] text-[#991B1B] border border-[#FECACA] border-l-[3px] border-l-[#EF4444]',
    dotCls: 'bg-[#EF4444]',
  },
  homework: {
    label: 'Homework Due',
    badgeCls: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] border-l-[3px] border-l-[#D97706]',
    dotCls: 'bg-[#D97706]',
  },
  holiday: {
    label: 'Holiday',
    badgeCls: 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] border-l-[3px] border-l-[#22C55E]',
    dotCls: 'bg-[#22C55E]',
  },
  meeting: {
    label: 'Meeting',
    badgeCls: 'bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE] border-l-[3px] border-l-[#3B82F6]',
    dotCls: 'bg-[#3B82F6]',
  },
}

export default function CalendarPage() {
  const { events, fetchEvents, addEvent, deleteEvent } = useCalendarStore()
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<EventKind | 'ALL'>('ALL')
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const categoryMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setCategoryMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

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

  // 7 days (Sun-Sat) for the week view, centered on the week containing currentDate
  const weekDays = useMemo(() => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return { date: d, dateKey: d.toISOString().slice(0, 10) }
    })
  }, [currentDate])

  // Events indexed by date string (YYYY-MM-DD), filtered by the selected category
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEventItem[]> = {}
    events
      .filter((ev) => categoryFilter === 'ALL' || ev.event_type === categoryFilter)
      .forEach((ev) => {
        const key = ev.start_at.slice(0, 10)
        if (!map[key]) map[key] = []
        map[key].push(ev)
      })
    return map
  }, [events, categoryFilter])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: events.length, class: 0, exam: 0, homework: 0, holiday: 0, meeting: 0 }
    events.forEach((ev) => {
      if (counts[ev.event_type] !== undefined) counts[ev.event_type] += 1
    })
    return counts
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
    <div className="min-h-full bg-[#FBF9F3] text-[#13231F] font-[Inter]">
      <PageHeader
        title="My Calendar"
        description="Teaching schedule, examinations, assignments due, and meetings."
        actions={
          <div className="relative" ref={categoryMenuRef}>
            <button
              type="button"
              onClick={() => setCategoryMenuOpen((v) => !v)}
              className="h-7 pl-2.5 pr-2 rounded-full bg-white border border-[#E5E7EB] text-[11px] font-medium text-[#1A221E] flex items-center gap-1.5 cursor-pointer hover:border-[#D1D5DB] transition-colors"
            >
              {categoryFilter !== 'ALL' && (
                <span className={`w-2 h-2 rounded-full ${EVENT_KIND_STYLES[categoryFilter].dotCls}`} />
              )}
              {categoryFilter === 'ALL' ? 'All Categories' : EVENT_KIND_STYLES[categoryFilter].label}
              <ChevronDown className={`w-3.5 h-3.5 text-[#8A8F98] transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {categoryMenuOpen && (
              <div className="absolute top-9 right-0 w-[200px] bg-white border border-[#E5E7EB] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.10)] p-1.5 z-30">
                <div
                  onClick={() => {
                    setCategoryFilter('ALL')
                    setCategoryMenuOpen(false)
                  }}
                  className={`px-3 py-2 rounded-[8px] text-[13px] cursor-pointer flex items-center justify-between transition-colors ${
                    categoryFilter === 'ALL' ? 'bg-[#11181C] text-white' : 'hover:bg-[#F8F5EE] text-[#374151]'
                  }`}
                >
                  <span className="font-medium">All Categories</span>
                  <span className={`font-mono text-[11px] px-2 h-5 rounded-full flex items-center justify-center min-w-[22px] ${
                    categoryFilter === 'ALL' ? 'bg-white/15 text-white' : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}>
                    {categoryCounts.ALL}
                  </span>
                </div>
                {(Object.keys(EVENT_KIND_STYLES) as EventKind[]).map((kind) => {
                  const conf = EVENT_KIND_STYLES[kind]
                  const active = categoryFilter === kind
                  return (
                    <div
                      key={kind}
                      onClick={() => {
                        setCategoryFilter(kind)
                        setCategoryMenuOpen(false)
                      }}
                      className={`px-3 py-2 rounded-[8px] text-[13px] cursor-pointer flex items-center justify-between transition-colors ${
                        active ? 'bg-[#11181C] text-white' : 'hover:bg-[#F8F5EE] text-[#374151]'
                      }`}
                    >
                      <span className="font-medium flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${conf.dotCls}`} />
                        {conf.label}
                      </span>
                      <span className={`font-mono text-[11px] px-2 h-5 rounded-full flex items-center justify-center min-w-[22px] ${
                        active ? 'bg-white/15 text-white' : 'bg-[#F3F4F6] text-[#6B7280]'
                      }`}>
                        {categoryCounts[kind]}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        }
      />

      <SearchToolbar>
        <div className="flex items-center h-9 p-1 rounded-full bg-white border border-[#E5E7EB] gap-0.5 shrink-0">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`h-7 px-3 rounded-full text-[12px] font-medium capitalize transition-all cursor-pointer ${
                viewMode === mode ? 'bg-[#1a2421] text-white' : 'text-[#6B7280] hover:text-[#11181C]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="ml-auto h-10 px-4 rounded-xl bg-[#11181C] hover:bg-black text-white text-[14px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </SearchToolbar>

      <div className="px-8 pb-8 space-y-4">
        {/* Toolbar: Navigation and Month Display */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 px-4 rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg lg:text-[18px] font-bold text-[#11181C]">
              {monthName}
            </h2>
            <button
              onClick={goToToday}
              className="h-6 px-2.5 rounded-full border border-[#E5E7EB] bg-white text-[12px] font-medium text-[#11181C] cursor-pointer hover:border-[#D1D5DB] transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevPeriod}
              className="w-8 h-8 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#6B7280] hover:text-[#11181C] hover:border-[#D1D5DB] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPeriod}
              className="w-8 h-8 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#6B7280] hover:text-[#11181C] hover:border-[#D1D5DB] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Calendar View: Month Grid */}
        {viewMode === 'month' && (
          <div className="bg-white rounded-2xl border-2 border-[#E5DDC8] overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b-2 border-[#E5DDC8] divide-x divide-[#E5DDC8] bg-[#FEF6E7] h-11">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                <div
                  key={d}
                  className="flex items-center justify-center text-[11px] font-mono uppercase tracking-wide text-[#6B7280]"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day Cells Matrix */}
            <div className="grid grid-cols-7 divide-x divide-y divide-[#E8E0CC]">
              {calendarDays.map((cell, idx) => {
                const isToday = cell.dateKey === todayKey
                const isWeekend = idx % 7 === 0 || idx % 7 === 6
                const dayEvents = eventsByDate[cell.dateKey] || []

                return (
                  <div
                    key={idx}
                    onClick={() => handleOpenAddModal(cell.dateKey)}
                    className={`min-h-[120px] p-3 flex flex-col gap-1.5 transition-colors group cursor-pointer ${
                      cell.isCurrentMonth
                        ? isWeekend
                          ? 'bg-[#FFFCF2] hover:bg-[#FFFAEE]'
                          : 'bg-white hover:bg-[#FFFEFB]'
                        : 'bg-[#FCFCFA] text-black/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center justify-center text-[14px] leading-none ${
                          isToday
                            ? 'w-7 h-7 rounded-full bg-[#11181C] text-white font-semibold'
                            : cell.isCurrentMonth
                            ? 'text-[#11181C] font-medium'
                            : 'text-[#9CA3AF] font-medium'
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-medium text-[#9CA3AF]">
                          {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                        </span>
                      )}
                    </div>

                    {/* Event Chips */}
                    <div className="space-y-1 flex-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const conf = EVENT_KIND_STYLES[ev.event_type] || EVENT_KIND_STYLES.class
                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEvent(ev)
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium truncate cursor-pointer shadow-sm transition-transform hover:scale-[1.02] ${conf.badgeCls}`}
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

      {/* Week View: 7-day grid, one row */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border-2 border-[#E5DDC8] overflow-hidden">
          <div className="grid grid-cols-7 border-b-2 border-[#E5DDC8] divide-x divide-[#E5DDC8] bg-[#FEF6E7] h-11">
            {weekDays.map((d) => (
              <div
                key={d.dateKey}
                className="flex items-center justify-center text-[11px] font-mono uppercase tracking-wide text-[#6B7280]"
              >
                {d.date.toLocaleDateString('default', { weekday: 'short' })}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-[#E8E0CC]">
            {weekDays.map((d, idx) => {
              const isToday = d.dateKey === todayKey
              const isWeekend = idx === 0 || idx === 6
              const dayEvents = eventsByDate[d.dateKey] || []

              return (
                <div
                  key={d.dateKey}
                  onClick={() => handleOpenAddModal(d.dateKey)}
                  className={`min-h-[420px] p-3 flex flex-col gap-1.5 cursor-pointer transition-colors ${
                    isWeekend ? 'bg-[#FFFCF2] hover:bg-[#FFFAEE]' : 'hover:bg-[#FFFEFB]'
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center self-start text-[14px] leading-none ${
                      isToday ? 'w-7 h-7 rounded-full bg-[#11181C] text-white font-semibold' : 'text-[#11181C] font-medium'
                    }`}
                  >
                    {d.date.getDate()}
                  </span>

                  <div className="space-y-1 flex-1 overflow-y-auto">
                    {dayEvents.map((ev) => {
                      const conf = EVENT_KIND_STYLES[ev.event_type] || EVENT_KIND_STYLES.class
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedEvent(ev)
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium truncate cursor-pointer shadow-sm transition-transform hover:scale-[1.02] ${conf.badgeCls}`}
                        >
                          {ev.title}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Day View: single-day agenda list */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h3 className="font-bold text-lg text-[#11181C]">
              Scheduled Entries for {currentDate.toLocaleDateString()}
            </h3>
            <span className="text-xs text-[#6B7280]">
              {eventsByDate[currentDate.toISOString().slice(0, 10)]?.length || 0} events
            </span>
          </div>

          <div className="space-y-3">
            {(eventsByDate[currentDate.toISOString().slice(0, 10)] || []).length === 0 ? (
              <div className="text-center py-12 text-[#9CA3AF] text-sm">
                No events scheduled for this date. Click "+ Add Event" to create one.
              </div>
            ) : (
              (eventsByDate[currentDate.toISOString().slice(0, 10)] || []).map((ev) => {
                const conf = EVENT_KIND_STYLES[ev.event_type] || EVENT_KIND_STYLES.class
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FEF9F3] hover:bg-[#FFFEFB] transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${conf.badgeCls}`}>
                          {conf.label}
                        </span>
                        <h4 className="font-semibold text-[14px] text-[#11181C]">{ev.title}</h4>
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
      </div>

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
