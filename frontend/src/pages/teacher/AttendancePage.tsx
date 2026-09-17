import React, { useEffect } from 'react'
import {
  UserCheck,
  UserX,
  Clock,
  ShieldAlert,
  Calendar,
  Save,
  CheckCircle2,
  Users,
  TrendingUp,
  AlertCircle,
  FileCheck
} from 'lucide-react'
import { useAttendanceStore } from '../../store/attendanceStore'

export default function AttendancePage() {
  const {
    sectionName,
    attendanceDate,
    records,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    totalStudents,
    isSaved,
    loading,
    saving,
    error,
    saveSuccessToast,
    summary,
    fetchDailyAttendance,
    setStudentStatus,
    setStudentNote,
    markAllPresent,
    saveAttendance,
    fetchSummary,
    setSectionName,
    setAttendanceDate,
    dismissToast,
  } = useAttendanceStore()

  useEffect(() => {
    void fetchDailyAttendance(sectionName, attendanceDate)
    void fetchSummary(sectionName)
  }, [sectionName, attendanceDate])

  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#13231F] font-[Inter]">
      {/* TOAST FEEDBACK */}
      {saveSuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#13231F] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#7FBF7A]/40 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#7FBF7A]" />
          <div>
            <div className="text-sm font-semibold">Attendance Saved</div>
            <div className="text-xs text-white/70">
              {sectionName} record for {attendanceDate} has been saved to database.
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="border-b border-[#E8E0CC] bg-[#FCFBF8] px-6 py-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-6 rounded-full bg-[#7FBF7A]" />
              <h1 className="font-[Poppins] text-2xl lg:text-3xl font-bold tracking-tight text-[#13231F]">
                Student Attendance Register
              </h1>
            </div>
            <p className="text-[13.5px] text-[#13231F]/60">
              Daily classroom roll-call workstation, attendance rates, and student remarks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* SECTION SELECTOR */}
            <select
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="h-10 px-3.5 rounded-xl border border-[#E8E0CC] bg-[#FAF9F5] text-xs font-semibold text-[#13231F] focus:outline-none focus:ring-1 focus:ring-[#7FBF7A]"
            >
              <option value="10-A">Class 10-A (Mathematics)</option>
              <option value="10-B">Class 10-B (Mathematics)</option>
              <option value="9-A">Class 9-A (Science)</option>
            </select>

            {/* DATE PICKER */}
            <div className="relative">
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="h-10 px-3.5 rounded-xl border border-[#E8E0CC] bg-[#FAF9F5] text-xs font-semibold text-[#13231F] focus:outline-none focus:ring-1 focus:ring-[#7FBF7A]"
              />
            </div>

            {/* MARK ALL PRESENT */}
            <button
              onClick={markAllPresent}
              className="h-10 px-4 rounded-xl border border-[#E8E0CC] bg-[#FAF9F5] hover:bg-white text-xs font-semibold text-[#13231F] transition"
            >
              Mark All Present
            </button>

            {/* SAVE ATTENDANCE */}
            <button
              onClick={() => void saveAttendance()}
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-[#13231F] hover:bg-[#13231F]/90 text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <Save className="w-3.5 h-3.5 text-[#7FBF7A]" />
              <span>{saving ? 'Saving...' : isSaved ? 'Update Register' : 'Save Register'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRICS BAR */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {/* RATE */}
          <div className="bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#13231F]/50">
                Attendance Rate
              </span>
              <TrendingUp className="w-4 h-4 text-[#7FBF7A]" />
            </div>
            <div className="mt-2 text-2xl font-bold font-[Poppins] text-[#13231F]">
              {attendanceRate}%
            </div>
            <div className="w-full bg-[#13231F]/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#7FBF7A] h-full rounded-full transition-all duration-300"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>

          {/* TOTAL */}
          <div className="bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#13231F]/50">
                Enrolled
              </span>
              <Users className="w-4 h-4 text-[#13231F]/40" />
            </div>
            <div className="mt-2 text-2xl font-bold font-[Poppins] text-[#13231F]">
              {totalStudents}
            </div>
            <div className="text-[11.5px] text-[#13231F]/50 mt-0.5">Section {sectionName}</div>
          </div>

          {/* PRESENT */}
          <div className="bg-[#FCFBF8] border border-[#C8E6D3] rounded-2xl p-4 shadow-sm bg-gradient-to-b from-[#EBF5EF]/30 to-[#FCFBF8]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1B4D3E]">
                Present
              </span>
              <UserCheck className="w-4 h-4 text-[#1B4D3E]" />
            </div>
            <div className="mt-2 text-2xl font-bold font-[Poppins] text-[#1B4D3E]">
              {presentCount}
            </div>
            <div className="text-[11.5px] text-[#1B4D3E]/70 mt-0.5">In Classroom</div>
          </div>

          {/* ABSENT */}
          <div className="bg-[#FCFBF8] border border-[#FADBD8] rounded-2xl p-4 shadow-sm bg-gradient-to-b from-[#FDEDEC]/30 to-[#FCFBF8]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#922B21]">
                Absent
              </span>
              <UserX className="w-4 h-4 text-[#922B21]" />
            </div>
            <div className="mt-2 text-2xl font-bold font-[Poppins] text-[#922B21]">
              {absentCount}
            </div>
            <div className="text-[11.5px] text-[#922B21]/70 mt-0.5">Unexcused / Illness</div>
          </div>

          {/* LATE / EXCUSED */}
          <div className="bg-[#FCFBF8] border border-[#FAD7A0] rounded-2xl p-4 shadow-sm bg-gradient-to-b from-[#FEF5E7]/30 to-[#FCFBF8]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A580C]">
                Late / Excused
              </span>
              <Clock className="w-4 h-4 text-[#8A580C]" />
            </div>
            <div className="mt-2 text-2xl font-bold font-[Poppins] text-[#8A580C]">
              {lateCount + excusedCount}
            </div>
            <div className="text-[11.5px] text-[#8A580C]/70 mt-0.5">
              {lateCount} Late • {excusedCount} Excused
            </div>
          </div>
        </div>

        {/* STATUS BANNER */}
        <div className="mt-4 flex items-center justify-between px-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isSaved ? 'bg-[#7FBF7A]' : 'bg-[#D9A94E]'}`}
            />
            <span className="font-medium text-[#13231F]/70">
              {isSaved
                ? `Register saved in database for ${sectionName} on ${attendanceDate}.`
                : `Unsaved register session for ${sectionName}. Click 'Save Register' to persist.`}
            </span>
          </div>

          <div className="text-[#13231F]/50">
            CBSE Academic Year 2026-27
          </div>
        </div>

        {/* STUDENT ROSTER TABLE */}
        <div className="mt-4 bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl shadow-sm overflow-hidden">
          {loading && (
            <div className="py-16 text-center text-sm text-[#13231F]/50">
              <span className="w-5 h-5 border-2 border-[#13231F]/20 border-t-[#13231F] rounded-full inline-block animate-spin mr-2 align-middle" />
              Loading student roster...
            </div>
          )}

          {!loading && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E0CC] bg-[#FAF9F5] text-[11px] font-bold uppercase tracking-wider text-[#13231F]/60">
                    <th className="py-3 px-4 w-20">Roll No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4 w-96 text-center">Attendance Status</th>
                    <th className="py-3 px-4">Teacher Remark / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0CC]/60">
                  {records.map((r, idx) => {
                    const initials = r.student_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)

                    return (
                      <tr
                        key={r.student_id}
                        className={`hover:bg-[#FAF9F5]/70 transition-colors ${
                          idx % 2 === 0 ? 'bg-[#FCFBF8]' : 'bg-white/40'
                        }`}
                      >
                        {/* ROLL NO */}
                        <td className="py-3.5 px-4 font-mono text-xs text-[#13231F]/60 font-medium">
                          {r.roll_no}
                        </td>

                        {/* STUDENT NAME */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#13231F]/10 text-[#13231F] text-xs font-bold flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <span className="font-semibold text-[14px] text-[#13231F]">
                              {r.student_name}
                            </span>
                          </div>
                        </td>

                        {/* 4 STATUS PILLS */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* PRESENT */}
                            <button
                              type="button"
                              onClick={() => setStudentStatus(r.student_id, 'present')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                                r.status === 'present'
                                  ? 'bg-[#1B4D3E] text-white shadow-sm'
                                  : 'bg-[#FAF9F5] text-[#13231F]/60 border border-[#E8E0CC] hover:bg-white'
                              }`}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Present</span>
                            </button>

                            {/* ABSENT */}
                            <button
                              type="button"
                              onClick={() => setStudentStatus(r.student_id, 'absent')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                                r.status === 'absent'
                                  ? 'bg-[#922B21] text-white shadow-sm'
                                  : 'bg-[#FAF9F5] text-[#13231F]/60 border border-[#E8E0CC] hover:bg-white'
                              }`}
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Absent</span>
                            </button>

                            {/* LATE */}
                            <button
                              type="button"
                              onClick={() => setStudentStatus(r.student_id, 'late')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                                r.status === 'late'
                                  ? 'bg-[#8A580C] text-white shadow-sm'
                                  : 'bg-[#FAF9F5] text-[#13231F]/60 border border-[#E8E0CC] hover:bg-white'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Late</span>
                            </button>

                            {/* EXCUSED */}
                            <button
                              type="button"
                              onClick={() => setStudentStatus(r.student_id, 'excused')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                                r.status === 'excused'
                                  ? 'bg-[#2E4053] text-white shadow-sm'
                                  : 'bg-[#FAF9F5] text-[#13231F]/60 border border-[#E8E0CC] hover:bg-white'
                              }`}
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Excused</span>
                            </button>
                          </div>
                        </td>

                        {/* REMARKS INPUT */}
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            value={r.note || ''}
                            onChange={(e) => setStudentNote(r.student_id, e.target.value)}
                            placeholder="Add remark..."
                            className="w-full h-8 px-3 rounded-lg border border-[#E8E0CC] bg-[#FAF9F5] text-xs text-[#13231F] placeholder-[#13231F]/30 focus:outline-none focus:ring-1 focus:ring-[#7FBF7A]"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ATTENDANCE SUMMARY & HISTORICAL LOGS */}
        {summary && summary.history && summary.history.length > 0 && (
          <div className="mt-8 bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-[Poppins] text-base font-bold text-[#13231F]">
                  Recent Attendance Logs for Section {sectionName}
                </h3>
                <p className="text-xs text-[#13231F]/60 mt-0.5">
                  Average monthly attendance rate: {summary.average_rate}% over {summary.total_sessions} logged sessions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {summary.history.map((item, i) => (
                <div
                  key={i}
                  className="bg-[#FAF9F5] border border-[#E8E0CC] rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#13231F] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#7FBF7A]" />
                      <span>{item.date}</span>
                    </div>
                    <div className="text-[11px] text-[#13231F]/60 mt-0.5">
                      {item.present} present, {item.absent} absent, {item.late} late
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-[Poppins] text-[#1B4D3E]">
                      {item.rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
