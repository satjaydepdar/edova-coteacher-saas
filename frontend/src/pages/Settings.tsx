import { useEffect, useState } from 'react'
import {
  User,
  Shield,
  GraduationCap,
  Building2,
  CheckCircle2,
  AlertCircle,
  Save,
  Key,
  Volume2,
  Calculator,
  Clock,
  Sparkles,
  Users,
  Bot,
  Cpu,
  Zap,
  Lock,
  RotateCcw,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import {
  settingsApi,
  type SettingsData,
  type UserPreferences,
  type SchoolSettingsDetail,
  type LlmSettings,
} from '../lib/settingsApi'

type TabKey = 'profile' | 'teaching' | 'llm' | 'learning' | 'school'

export default function Settings() {
  const { user: authUser } = useAuthStore()
  const [data, setData] = useState<SettingsData | null>(null)
  const [schoolData, setSchoolData] = useState<SchoolSettingsDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  // Determine available tabs based on user role
  const role = authUser?.role ?? 'MEMBER'
  const isTeacher = role === 'TEACHER'
  const isStudent = role === 'STUDENT'
  const isAdmin = role === 'ADMIN'

  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  // Profile Form State
  const [fullName, setFullName] = useState('')
  const [savedFullName, setSavedFullName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Preferences Form State
  const [preferences, setPreferences] = useState<UserPreferences>({
    default_test_timer_minutes: 45,
    mastery_alert_threshold: 50,
    socratic_sal_level: 100,
    formula_editor_mode: 'mathlive',
    sound_effects_enabled: true,
  })
  const [savedPreferences, setSavedPreferences] = useState<UserPreferences | null>(null)

  // LLM Configuration State
  const [llmSettings, setLlmSettings] = useState<LlmSettings>({
    llm_tier: 'STANDARD',
    enable_student_chatbot: true,
    enable_teacher_lesson_planner: true,
    default_socratic_sal: 100,
    monthly_token_budget_k: 500,
  })
  const [savedLlmSettings, setSavedLlmSettings] = useState<LlmSettings | null>(null)

  // School Settings State (for Admin)
  const [cbseCode, setCbseCode] = useState('')
  const [savedCbseCode, setSavedCbseCode] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [savedAcademicYear, setSavedAcademicYear] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await settingsApi.getSettings()
      setData(res)
      setFullName(res.user.full_name || '')
      setSavedFullName(res.user.full_name || '')
      setPreferences(res.preferences)
      setSavedPreferences(res.preferences)
      if (res.llm_settings) {
        setLlmSettings(res.llm_settings)
        setSavedLlmSettings(res.llm_settings)
      }
      const initialCbse = res.tenant_settings.cbse_affiliation_code || 'CBSE-2026'
      const initialYear = res.tenant_settings.academic_year || '2026-2027'
      setCbseCode(initialCbse)
      setSavedCbseCode(initialCbse)
      setAcademicYear(initialYear)
      setSavedAcademicYear(initialYear)

      if (isAdmin) {
        try {
          const s = await settingsApi.getSchoolSettings()
          setSchoolData(s)
          if (s.llm_settings) {
            setLlmSettings(s.llm_settings)
            setSavedLlmSettings(s.llm_settings)
          }
          setCbseCode(s.cbse_affiliation_code)
          setSavedCbseCode(s.cbse_affiliation_code)
          setAcademicYear(s.academic_year)
          setSavedAcademicYear(s.academic_year)
        } catch {
          // non-fatal if school settings query fails
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load settings.')
    } finally {
      setLoading(false)
    }
  }

  // Dirty state computations
  const isProfileDirty =
    fullName.trim() !== savedFullName.trim() ||
    currentPassword.length > 0 ||
    newPassword.length > 0 ||
    confirmPassword.length > 0

  const isTeachingDirty =
    savedPreferences !== null &&
    (preferences.default_test_timer_minutes !== savedPreferences.default_test_timer_minutes ||
      preferences.mastery_alert_threshold !== savedPreferences.mastery_alert_threshold ||
      preferences.socratic_sal_level !== savedPreferences.socratic_sal_level)

  const isLlmDirty =
    savedLlmSettings !== null &&
    (llmSettings.llm_tier !== savedLlmSettings.llm_tier ||
      llmSettings.enable_student_chatbot !== savedLlmSettings.enable_student_chatbot ||
      llmSettings.enable_teacher_lesson_planner !== savedLlmSettings.enable_teacher_lesson_planner ||
      llmSettings.default_socratic_sal !== savedLlmSettings.default_socratic_sal ||
      llmSettings.monthly_token_budget_k !== savedLlmSettings.monthly_token_budget_k)

  const isLearningDirty =
    savedPreferences !== null &&
    (preferences.formula_editor_mode !== savedPreferences.formula_editor_mode ||
      preferences.sound_effects_enabled !== savedPreferences.sound_effects_enabled)

  const isSchoolDirty =
    cbseCode.trim() !== savedCbseCode.trim() ||
    academicYear.trim() !== savedAcademicYear.trim()

  const handleDiscardProfile = () => {
    setFullName(savedFullName)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
  }

  const handleDiscardTeaching = () => {
    if (savedPreferences) setPreferences(savedPreferences)
    setError(null)
  }

  const handleDiscardLlm = () => {
    if (savedLlmSettings) setLlmSettings(savedLlmSettings)
    setError(null)
  }

  const handleDiscardSchool = () => {
    setCbseCode(savedCbseCode)
    setAcademicYear(savedAcademicYear)
    setError(null)
  }

  const handleDiscardLearning = () => {
    if (savedPreferences) setPreferences(savedPreferences)
    setError(null)
  }

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setError(msg)
      setSuccessMsg(null)
    } else {
      setSuccessMsg(msg)
      setError(null)
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword) {
      if (!currentPassword) {
        showNotification('Current password is required to set a new password.', true)
        return
      }
      if (newPassword !== confirmPassword) {
        showNotification('New password and confirmation do not match.', true)
        return
      }
      if (newPassword.length < 6) {
        showNotification('New password must be at least 6 characters.', true)
        return
      }
    }

    setSaving(true)
    try {
      const payload: { full_name?: string; current_password?: string; new_password?: string } = {
        full_name: fullName,
      }
      if (newPassword) {
        payload.current_password = currentPassword
        payload.new_password = newPassword
      }

      await settingsApi.updateProfile(payload)
      setSavedFullName(fullName)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showNotification('Profile updated successfully!')
      loadAll()
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update profile.', true)
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await settingsApi.updatePreferences(preferences)
      setPreferences(res.preferences)
      setSavedPreferences(res.preferences)
      showNotification('Classroom & learning preferences saved successfully!')
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save preferences.', true)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await settingsApi.updateSchoolSettings({
        cbse_affiliation_code: cbseCode,
        academic_year: academicYear,
      })
      setCbseCode(res.cbse_affiliation_code)
      setSavedCbseCode(res.cbse_affiliation_code)
      setAcademicYear(res.academic_year)
      setSavedAcademicYear(res.academic_year)
      showNotification('School affiliation details updated successfully!')
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update school settings.', true)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveLlm = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await settingsApi.updateLlmSettings(llmSettings)
      setLlmSettings(res.llm_settings)
      setSavedLlmSettings(res.llm_settings)
      showNotification('School AI & LLM configuration updated successfully!')
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update LLM configuration.', true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-full w-full bg-[#FBF9F3] text-[#1A221E] flex items-center justify-center py-24">
        <div className="flex items-center gap-3 font-mono text-[13px] text-[#8A7D67]">
          <span className="w-2 h-2 rounded-full bg-[#DDB56E] animate-ping" />
          Loading workspace settings...
        </div>
      </div>
    )
  }

  const tenantName = data?.user.tenant_name || authUser?.tenant_name || 'Edova Academy'
  const userInitials = (data?.user.full_name || authUser?.full_name || 'ED')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="relative min-h-full w-full bg-[#FBF9F3] text-[#1A221E] selection:bg-[#DDB56E]/30 flex flex-col font-sans pb-16">
      {/* Background Dotted Grid Texture */}
      <div className="pointer-events-none absolute inset-0 dotted-grid opacity-[0.32]" />

      {/* Top Header Bar matching Practice Questions */}
      <header className="relative z-10 h-[72px] px-6 lg:px-8 flex items-center justify-between border-b border-[#EDE8DD] bg-[#FBF9F3]/80 backdrop-blur-[8px] sticky top-0 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-1 h-7 rounded shrink-0" style={{ background: '#D4A017' }} />
              <h1 className="page-header-h1 text-[24px] lg:text-[28px]">
                Settings
              </h1>
              <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[#8A7D67]">
                {role} PREFERENCES
              </span>
            </div>
            <p className="text-[11.5px] text-[#6B7280] mt-1 font-sans">
              {activeTab === 'profile' && 'Manage personal identity, institutional credentials, and access passwords'}
              {activeTab === 'teaching' && 'Manage classroom cohorts, diagnostic timer defaults, and mastery thresholds'}
              {activeTab === 'llm' && 'Configure campus AI subscription tier, model access, and token quotas'}
              {activeTab === 'school' && 'Manage CBSE board affiliation, academic year, and multi-tenant metrics'}
              {activeTab === 'learning' && 'Customize equation board input and interactive audio feedback'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-[#8A7D67] bg-[#F6F1E6] px-3 py-1 rounded-full border border-[#EDE8DD]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DDB56E]" />
            <span>{tenantName}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#1A221E] text-white flex items-center justify-center text-[11px] font-medium shadow-xs">
            {userInitials}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 max-w-[980px] w-full mx-auto px-5 lg:px-8 pt-6 space-y-6">
        {/* Alerts / Feedback */}
        {successMsg && (
          <div className="p-4 rounded-[14px] bg-[#F1F8F3] border border-[#CDE5D4] text-[#246A3B] text-[13px] flex items-center gap-2.5 shadow-xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D47]" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-[14px] bg-[#FEF2F2] border border-[#FCD5D5] text-[#991B1B] text-[13px] flex items-center gap-2.5 shadow-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Enterprise Bottom-Bordered Tab Navigation Bar */}
        <div className="border-b border-[#EDE8DD] flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3.5 text-[13px] font-medium transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#1A221E] text-[#111814] font-semibold'
                : 'border-transparent text-[#6B7280] hover:text-[#111814] hover:border-[#DDB56E]/50'
            }`}
          >
            <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-[#111814]' : 'text-[#8A8F8B]'}`} />
            <span>Profile & Security</span>
          </button>

          {(isTeacher || isAdmin) && (
            <button
              type="button"
              onClick={() => setActiveTab('teaching')}
              className={`pb-3 px-3.5 text-[13px] font-medium transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'teaching'
                  ? 'border-[#1A221E] text-[#111814] font-semibold'
                  : 'border-transparent text-[#6B7280] hover:text-[#111814] hover:border-[#DDB56E]/50'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${activeTab === 'teaching' ? 'text-[#111814]' : 'text-[#8A8F8B]'}`} />
              <span>Teaching & Classroom</span>
            </button>
          )}

          {(isTeacher || isAdmin) && (
            <button
              type="button"
              onClick={() => setActiveTab('llm')}
              className={`pb-3 px-3.5 text-[13px] font-medium transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'llm'
                  ? 'border-[#1A221E] text-[#111814] font-semibold'
                  : 'border-transparent text-[#6B7280] hover:text-[#111814] hover:border-[#DDB56E]/50'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === 'llm' ? 'text-[#111814]' : 'text-[#8A8F8B]'}`} />
              <span>AI & LLM Features</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('school')}
              className={`pb-3 px-3.5 text-[13px] font-medium transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'school'
                  ? 'border-[#1A221E] text-[#111814] font-semibold'
                  : 'border-transparent text-[#6B7280] hover:text-[#111814] hover:border-[#DDB56E]/50'
              }`}
            >
              <Building2 className={`w-4 h-4 ${activeTab === 'school' ? 'text-[#111814]' : 'text-[#8A8F8B]'}`} />
              <span>School & Affiliation</span>
            </button>
          )}

          {isStudent && (
            <button
              type="button"
              onClick={() => setActiveTab('learning')}
              className={`pb-3 px-3.5 text-[13px] font-medium transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'learning'
                  ? 'border-[#1A221E] text-[#111814] font-semibold'
                  : 'border-transparent text-[#6B7280] hover:text-[#111814] hover:border-[#DDB56E]/50'
              }`}
            >
              <Calculator className={`w-4 h-4 ${activeTab === 'learning' ? 'text-[#111814]' : 'text-[#8A8F8B]'}`} />
              <span>Learning Canvas</span>
            </button>
          )}
        </div>

        {/* TAB 1: PROFILE & SECURITY */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Account Information Card */}
            <div className="rounded-[16px] bg-white border border-[#EDE8DD] card-shadow p-6 space-y-5">
              <div>
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F8B] uppercase">
                  ACCOUNT IDENTITY
                </span>
                <h2 className="text-[17px] font-[600] text-[#111814] mt-0.5">Profile Details</h2>
                <p className="text-[12.5px] text-[#6B7280]">
                  Your verified identity and institution affiliation within Edova.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#4A5568] mb-1.5">
                      Full Display Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="e.g. Rahul Verma"
                      className="w-full h-10 px-3.5 rounded-[12px] bg-white border border-[#EDE8DD] text-[13px] text-[#111814] outline-none focus:border-[#DDB56E] focus:ring-1 focus:ring-[#DDB56E] transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] font-medium text-[#4A5568]">
                        Work Email Address
                      </label>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verified
                      </span>
                    </div>
                    <input
                      type="email"
                      value={data?.user.email || ''}
                      disabled
                      className="w-full h-10 px-3.5 rounded-[12px] bg-[#F9F7F1] border border-[#EDE8DD] text-[13px] text-[#4A5568] font-mono cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                {/* Organizational Identity (Read-only Metadata) */}
                <div className="pt-2 border-t border-[#EDE8DD]/70">
                  <div className="text-[10.5px] font-mono tracking-[0.12em] text-[#8A8F8B] uppercase mb-2.5 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-[#8A8F8B]" /> Institutional Credentials (Read-only)
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-[12px] bg-[#F9F7F1] border border-[#EDE8DD] flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-[#6B7280] block">Assigned Role</span>
                        <span className="text-[13.5px] font-semibold text-[#111814] mt-0.5 block">{role}</span>
                      </div>
                      <span className="text-[10.5px] font-mono text-[#8A7D67] bg-white px-2 py-0.5 rounded border border-[#EDE8DD] flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Managed
                      </span>
                    </div>

                    <div className="p-3.5 rounded-[12px] bg-[#F9F7F1] border border-[#EDE8DD] flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-[#6B7280] block">School / Institution</span>
                        <span className="text-[13.5px] font-semibold text-[#111814] mt-0.5 truncate max-w-[220px] block">
                          {tenantName}
                        </span>
                      </div>
                      <Building2 className="w-4 h-4 text-[#8A7D67]" />
                    </div>
                  </div>
                </div>

                {/* Password Change Section (Responsive 2-Tier Layout) */}
                <div className="pt-4 border-t border-[#EDE8DD] space-y-4">
                  <div>
                    <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F8B] uppercase">
                      CREDENTIALS & SECURITY
                    </span>
                    <h3 className="text-[15px] font-[600] text-[#111814] mt-0.5 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#DDB56E]" /> Change Access Password
                    </h3>
                    <p className="text-[12px] text-[#6B7280]">
                      Leave empty if you only want to update your profile name.
                    </p>
                  </div>

                  {/* Tier 1: Current Password on its own row */}
                  <div className="max-w-md">
                    <label className="block text-[12px] font-medium text-[#4A5568] mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      className="w-full h-10 px-3.5 rounded-[12px] bg-white border border-[#EDE8DD] text-[13px] text-[#111814] outline-none focus:border-[#DDB56E] focus:ring-1 focus:ring-[#DDB56E] transition-all"
                    />
                  </div>

                  {/* Tier 2: New & Confirm Password in 2-column grid */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-[#4A5568] mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        autoComplete="new-password"
                        className="w-full h-10 px-3.5 rounded-[12px] bg-white border border-[#EDE8DD] text-[13px] text-[#111814] outline-none focus:border-[#DDB56E] focus:ring-1 focus:ring-[#DDB56E] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[#4A5568] mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        autoComplete="new-password"
                        className="w-full h-10 px-3.5 rounded-[12px] bg-white border border-[#EDE8DD] text-[13px] text-[#111814] outline-none focus:border-[#DDB56E] focus:ring-1 focus:ring-[#DDB56E] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Action Bar with Trust Signals & Dirty State */}
                <div className="pt-4 border-t border-[#EDE8DD] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                    <Clock className="w-3.5 h-3.5 text-[#8A7D67]" />
                    <span>{lastSavedAt ? `Last saved at ${lastSavedAt}` : 'All changes synced'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isProfileDirty && (
                      <button
                        type="button"
                        onClick={handleDiscardProfile}
                        disabled={saving}
                        className="h-9 px-4 rounded-full bg-white border border-[#EDE8DD] text-[12.5px] font-medium text-[#6B7280] hover:text-[#111814] hover:bg-[#FBF9F3] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!isProfileDirty || saving}
                      className="h-9 px-5 rounded-full bg-[#1A221E] hover:bg-black text-white text-[12.5px] font-medium shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? 'Saving changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: TEACHING & CLASSROOM (Teachers & Admins) */}
        {(isTeacher || isAdmin) && activeTab === 'teaching' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Section Overview Grid */}
            <div className="rounded-[16px] bg-white border border-[#EDE8DD] card-shadow p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F8B] uppercase">
                    ENROLLMENT & ROSTER
                  </span>
                  <h2 className="text-[17px] font-[600] text-[#111814] mt-0.5">
                    Class Sections & Cohorts
                  </h2>
                  <p className="text-[12.5px] text-[#6B7280]">
                    Sections assigned to your school for syllabus tracking and diagnostic testing.
                  </p>
                </div>
                <span className="font-mono text-[11px] px-3 py-1 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[#8A7D67]">
                  {data?.sections.length || 0} SECTIONS
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 pt-2">
                {data?.sections && data.sections.length > 0 ? (
                  data.sections.map((sec) => (
                    <div
                      key={sec.id}
                      className="p-4 rounded-[14px] bg-[#FBF9F3] border border-[#EDE8DD] flex flex-col justify-between hover:border-[#DDB56E] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white border border-[#EDE8DD] text-[#8A7D67]">
                          Grade {sec.grade || '10'}
                        </span>
                        <span className="text-[11px] font-mono text-[#6B7280]">
                          {sec.student_count} student{sec.student_count === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-[15px] font-bold text-[#111814]">
                          Section {sec.name}
                        </div>
                        <div className="text-[11.5px] text-[#8A8F8B] mt-0.5">
                          CBSE Mathematics & Science
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 py-6 text-center text-[12.5px] text-[#8A7D67] font-mono">
                    No classroom sections found. Contact your school administrator.
                  </div>
                )}
              </div>
            </div>

            {/* Test Authoring & Timer Defaults */}
            <div className="rounded-[16px] bg-white border border-[#EDE8DD] card-shadow p-6 space-y-6">
              <div>
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F8B] uppercase">
                  EXAMINATION CONTROLS
                </span>
                <h2 className="text-[17px] font-[600] text-[#111814] mt-0.5">
                  Mock Test & Assessment Defaults
                </h2>
                <p className="text-[12.5px] text-[#6B7280]">
                  Configure default examination windows and diagnostic trigger thresholds.
                </p>
              </div>

              <div className="space-y-6">
                {/* Default Test Duration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-medium text-[#111814] flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#8A7D67]" /> Default Test Duration
                    </label>
                    <span className="font-mono text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[#8A7D67]">
                      {preferences.default_test_timer_minutes} Minutes
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="180"
                    step="15"
                    value={preferences.default_test_timer_minutes}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        default_test_timer_minutes: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-[#1A221E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10.5px] font-mono text-[#8A8F8B]">
                    <span>15 min (Quick Quiz)</span>
                    <span>45 min (Standard Class)</span>
                    <span>90 min (Midterm)</span>
                    <span>180 min (Full Board)</span>
                  </div>
                </div>

                {/* Mastery Alert Threshold */}
                <div className="space-y-2 pt-2 border-t border-[#EDE8DD]">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[13px] font-medium text-[#111814] flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-[#DDB56E]" /> Low Mastery Alert Threshold
                      </label>
                      <p className="text-[12px] text-[#6B7280] mt-0.5">
                        Highlight students on the Analytics Dashboard when their concept mastery falls below this score.
                      </p>
                    </div>
                    <span className="font-mono text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[#8A7D67]">
                      {preferences.mastery_alert_threshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="80"
                    step="5"
                    value={preferences.mastery_alert_threshold}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        mastery_alert_threshold: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-[#1A221E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10.5px] font-mono text-[#8A8F8B]">
                    <span>30% (Critical Only)</span>
                    <span>50% (Recommended)</span>
                    <span>80% (High Rigor)</span>
                  </div>
                </div>

                {/* Socratic SAL Pedagogical Level */}
                <div className="space-y-2 pt-2 border-t border-[#EDE8DD]">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[13px] font-medium text-[#111814] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#DDB56E]" /> Socratic Assistance Level (SAL)
                      </label>
                      <p className="text-[12px] text-[#6B7280] mt-0.5">
                        Controls the depth of AI reasoning scaffolding in Practice Questions before revealing hints.
                      </p>
                    </div>
                    <span className="font-mono text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[#8A7D67]">
                      {preferences.socratic_sal_level}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="20"
                    value={preferences.socratic_sal_level}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        socratic_sal_level: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-[#1A221E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10.5px] font-mono text-[#8A8F8B]">
                    <span>0% (Direct Solution)</span>
                    <span>60% (Guided Prompts)</span>
                    <span>100% (Full Socratic Inquiry)</span>
                  </div>
                </div>
              </div>

              {/* Action Bar with Trust Signals & Dirty State */}
              <div className="pt-4 border-t border-[#EDE8DD] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                  <Clock className="w-3.5 h-3.5 text-[#8A7D67]" />
                  <span>{lastSavedAt ? `Last saved at ${lastSavedAt}` : 'All changes synced'}</span>
                </div>

                <div className="flex items-center gap-3">
                  {isTeachingDirty && (
                    <button
                      type="button"
                      onClick={handleDiscardTeaching}
                      disabled={saving}
                      className="h-9 px-4 rounded-full bg-white border border-[#EDE8DD] text-[12.5px] font-medium text-[#6B7280] hover:text-[#111814] hover:bg-[#FBF9F3] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    disabled={!isTeachingDirty || saving}
                    className="h-9 px-5 rounded-full bg-[#1A221E] hover:bg-black text-white text-[12.5px] font-medium shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving changes...' : 'Save Classroom Defaults'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: AI & LLM FEATURES (Teachers & Admins) */}
        {(isTeacher || isAdmin) && activeTab === 'llm' && (
          <div className="space-y-6 animate-fadeIn">
            {/* AI Tier Card */}
            <div className="rounded-[16px] bg-white border border-[#EDE8DD] card-shadow p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F8B] uppercase">
                    AI SUBSCRIPTION TIER
                  </span>
                  <h2 className="text-[17px] font-[600] text-[#111814] mt-0.5">
                    Cognitive Intelligence & Model Tier
                  </h2>
                  <p className="text-[12.5px] text-[#6B7280]">
                    Configures campus access to generative AI reasoning, student doubt solving, and automatic lesson planner.
                  </p>
                </div>
                <span className="font-mono text-[11px] px-3 py-1 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[#8A7D67]">
                  {isAdmin ? 'ADMIN CONFIGURABLE' : 'CAMPUS PROVISIONED'}
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 pt-2">
                {[
                  {
                    tier: 'NONE',
                    title: 'Tier 0: Rule-Based Only',
                    desc: 'Classical equation solvers & rigid validation. No AI token costs.',
                    tag: 'Basic',
                  },
                  {
                    tier: 'STANDARD',
                    title: 'Tier 1: Standard Socratic',
                    desc: 'Gemini Flash • Socratic hint generation & Student Doubt Solver Chatbot.',
                    tag: 'Recommended',
                  },
                  {
                    tier: 'PRO',
                    title: 'Tier 2: Advanced Co-Teacher',
                    desc: 'Full Socratic reasoning, Teacher AI Lesson Planner, and Dynamic Question Generation.',
                    tag: 'Full Suite',
                  },
                ].map((item) => {
                  const isSelected = llmSettings.llm_tier === item.tier
                  return (
                    <div
                      key={item.tier}
                      onClick={() => isAdmin && setLlmSettings({ ...llmSettings, llm_tier: item.tier })}
                      className={`p-4 rounded-[14px] border transition-all ${
                        isAdmin ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        isSelected
                          ? 'bg-[#FBF9F3] border-[#1A221E] shadow-xs'
                          : 'bg-white border-[#EDE8DD] hover:border-[#DDB56E]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white border border-[#EDE8DD] text-[#8A7D67]">
                          {item.tag}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#DDB56E]" />
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="text-[14px] font-bold text-[#111814]">{item.title}</div>
                        <div className="text-[11.5px] text-[#6B7280] mt-1 leading-relaxed">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* AI Module Toggles & Token Budget */}
            <form onSubmit={handleSaveLlm} className="rounded-[16px] bg-white border border-[#EDE8DD] card-shadow p-6 space-y-6">
              <div>
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F8B] uppercase">
                  LLM MODULE CONTROLS
                </span>
                <h2 className="text-[17px] font-[600] text-[#111814] mt-0.5">
                  Institutional Feature Toggles & Token Quota
                </h2>
                <p className="text-[12.5px] text-[#6B7280]">
                  {isAdmin
                    ? 'Activate specific generative AI capabilities and set monthly consumption caps.'
                    : 'Active AI capabilities enabled by your school administration.'}
                </p>
              </div>

              <div className="space-y-4">
                {/* Student AI Doubt Solver Toggle */}
                <div className="p-4 rounded-[14px] bg-[#FBF9F3] border border-[#EDE8DD] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#111814] flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-[#DDB56E]" /> Student AI Doubt Solver / Chatbot
                    </div>
                    <div className="text-[12px] text-[#6B7280] mt-0.5 max-w-xl leading-relaxed">
                      Allows students to converse with Socratic AI when stuck on homework or practice questions without giving direct solutions.
                    </div>
                  </div>

                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLlmSettings({
                          ...llmSettings,
                          enable_student_chatbot: !llmSettings.enable_student_chatbot,
                        })
                      }
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out shrink-0 ${
                        llmSettings.enable_student_chatbot ? 'bg-[#1A221E]' : 'bg-[#E5E1D2]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ease-in-out ${
                          llmSettings.enable_student_chatbot ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  ) : (
                    <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      {llmSettings.enable_student_chatbot ? 'ACTIVE ON CAMPUS' : 'DISABLED'}
                    </span>
                  )}
                </div>

                {/* Teacher AI Lesson Planner Toggle */}
                <div className="p-4 rounded-[14px] bg-[#FBF9F3] border border-[#EDE8DD] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#111814] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#DDB56E]" /> Teacher AI Lesson Planner & Content Co-Pilot
                    </div>
                    <div className="text-[12px] text-[#6B7280] mt-0.5 max-w-xl leading-relaxed">
                      Empowers teachers to draft 45-minute CBSE lesson blueprints, student worksheets, and diagnostic question sets in seconds.
                    </div>
                  </div>

                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLlmSettings({
                          ...llmSettings,
                          enable_teacher_lesson_planner: !llmSettings.enable_teacher_lesson_planner,
                        })
                      }
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out shrink-0 ${
                        llmSettings.enable_teacher_lesson_planner ? 'bg-[#1A221E]' : 'bg-[#E5E1D2]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ease-in-out ${
                          llmSettings.enable_teacher_lesson_planner ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  ) : (
                    <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      {llmSettings.enable_teacher_lesson_planner ? 'ACTIVE ON CAMPUS' : 'DISABLED'}
                    </span>
                  )}
                </div>

                {/* School-Wide Default SAL */}
                <div className="space-y-2 pt-2 border-t border-[#EDE8DD]">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[13px] font-medium text-[#111814] flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-[#DDB56E]" /> Baseline Socratic Assistance Level (SAL)
                      </label>
                      <p className="text-[12px] text-[#6B7280] mt-0.5">
                        School-wide default for step-by-step reasoning scaffolding before hints appear.
                      </p>
                    </div>
                    <span className="font-mono text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[#8A7D67]">
                      {llmSettings.default_socratic_sal}%
                    </span>
                  </div>
                  {isAdmin ? (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="20"
                      value={llmSettings.default_socratic_sal}
                      onChange={(e) =>
                        setLlmSettings({
                          ...llmSettings,
                          default_socratic_sal: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-[#1A221E] cursor-pointer"
                    />
                  ) : (
                    <div className="w-full bg-[#EDE8DD] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1A221E] h-full rounded-full"
                        style={{ width: `${llmSettings.default_socratic_sal}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Monthly Token Quota */}
                <div className="space-y-2 pt-2 border-t border-[#EDE8DD]">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[13px] font-medium text-[#111814] flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-[#DDB56E]" /> Monthly AI Token Budget
                      </label>
                      <p className="text-[12px] text-[#6B7280] mt-0.5">
                        Guards against API overages while allowing ~{Math.round(llmSettings.monthly_token_budget_k * 5)} student & teacher inquiries.
                      </p>
                    </div>
                    <span className="font-mono text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[#8A7D67]">
                      {llmSettings.monthly_token_budget_k}k Tokens / Mo
                    </span>
                  </div>
                  {isAdmin && (
                    <input
                      type="range"
                      min="100"
                      max="2000"
                      step="100"
                      value={llmSettings.monthly_token_budget_k}
                      onChange={(e) =>
                        setLlmSettings({
                          ...llmSettings,
                          monthly_token_budget_k: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-[#1A221E] cursor-pointer"
                    />
                  )}
                </div>
              </div>

              {isAdmin ? (
                <div className="pt-4 border-t border-[#EDE8DD] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                    <Clock className="w-3.5 h-3.5 text-[#8A7D67]" />
                    <span>{lastSavedAt ? `Last saved at ${lastSavedAt}` : 'All changes synced'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isLlmDirty && (
                      <button
                        type="button"
                        onClick={handleDiscardLlm}
                        disabled={saving}
                        className="h-9 px-4 rounded-full bg-white border border-[#EDE8DD] text-[12.5px] font-medium text-[#6B7280] hover:text-[#111814] hover:bg-[#FBF9F3] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!isLlmDirty || saving}
                      className="h-9 px-5 rounded-full bg-[#1A221E] hover:bg-black text-white text-[12.5px] font-medium shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? 'Saving changes...' : 'Save AI & LLM Settings'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-[12px] bg-[#FBF9F3] border border-[#EDE8DD] text-[12px] text-[#6B7280]">
                  ℹ️ AI feature access and quotas are managed by your School Administrator. You can customize your own class test assistance level in the <strong>Teaching & Classroom</strong> tab.
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 4: LEARNING CANVAS (Students) */}
        {isStudent && activeTab === 'learning' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Student Enrollment Card */}
            <div className="rounded-[16px] bg-white border border-[#EDE8DD] card-shadow p-6 space-y-4">
              <div>
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F8B] uppercase">
                  ACADEMIC ENROLLMENT
                </span>
                <h2 className="text-[17px] font-[600] text-[#111814] mt-0.5">Your Classroom Cohort</h2>
                <p className="text-[12.5px] text-[#6B7280]">
                  Your registered cohort for CBSE curriculum and personalized homework tests.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-[14px] bg-[#FBF9F3] border border-[#EDE8DD]">
                  <span className="text-[10px] font-mono text-[#8A7D67] uppercase">Registered Class</span>
                  <div className="text-[15px] font-bold text-[#111814] mt-0.5">
                    {data?.user.section ? `Class ${data.user.section.grade}-${data.user.section.name}` : 'CBSE Class 10'}
                  </div>
                  <div className="text-[11.5px] text-[#6B7280] mt-1">
                    Trigonometry, Life Processes, Acids & Bases
                  </div>
                </div>

                <div className="p-4 rounded-[14px] bg-[#FBF9F3] border border-[#EDE8DD]">
                  <span className="text-[10px] font-mono text-[#8A7D67] uppercase">School Affiliation</span>
                  <div className="text-[15px] font-bold text-[#111814] mt-0.5 truncate">
                    {tenantName}
                  </div>
                  <div className="text-[11.5px] text-[#6B7280] mt-1">
                    Academic Year {data?.tenant_settings.academic_year || '2026-2027'}
                  </div>
                </div>
              </div>
            </div>

            {/* Practice Questions & Equation Board Preferences */}
            <div className="rounded-[16px] bg-white border border-[#EDE8DD] card-shadow p-6 space-y-6">
              <div>
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F8B] uppercase">
                  WORKSPACE PREFERENCES
                </span>
                <h2 className="text-[17px] font-[600] text-[#111814] mt-0.5">
                  Equation Board & Audio Feedback
                </h2>
                <p className="text-[12.5px] text-[#6B7280]">
                  Customize how you solve mathematical problems in the Trigonometry practice engine.
                </p>
              </div>

              <div className="space-y-4">
                {/* Math Input Mode */}
                <div className="p-4 rounded-[14px] bg-[#FBF9F3] border border-[#EDE8DD] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#111814] flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-[#DDB56E]" /> Math Formula Input Mode
                    </div>
                    <div className="text-[12px] text-[#6B7280] mt-0.5">
                      Choose between interactive visual keypad or direct LaTeX text entry.
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#EDE8DD] shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreferences({ ...preferences, formula_editor_mode: 'mathlive' })}
                      className={`h-7 px-3 rounded-full text-[11.5px] font-medium transition-colors cursor-pointer ${
                        preferences.formula_editor_mode === 'mathlive'
                          ? 'bg-[#1A221E] text-white shadow-xs'
                          : 'text-[#6B7280] hover:text-[#111814]'
                      }`}
                    >
                      Visual Keypad
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferences({ ...preferences, formula_editor_mode: 'latex' })}
                      className={`h-7 px-3 rounded-full text-[11.5px] font-medium transition-colors cursor-pointer ${
                        preferences.formula_editor_mode === 'latex'
                          ? 'bg-[#1A221E] text-white shadow-xs'
                          : 'text-[#6B7280] hover:text-[#111814]'
                      }`}
                    >
                      LaTeX Code
                    </button>
                  </div>
                </div>

                {/* Sound Effects Toggle */}
                <div className="p-4 rounded-[14px] bg-[#FBF9F3] border border-[#EDE8DD] flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#111814] flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-[#DDB56E]" /> Step Completion Audio Chimes
                    </div>
                    <div className="text-[12px] text-[#6B7280] mt-0.5">
                      Play subtle audio confirmation when a mathematical reasoning step is solved correctly.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        sound_effects_enabled: !preferences.sound_effects_enabled,
                      })
                    }
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                      preferences.sound_effects_enabled ? 'bg-[#1A221E]' : 'bg-[#E5E1D2]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ease-in-out ${
                        preferences.sound_effects_enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Bar with Trust Signals & Dirty State */}
              <div className="pt-4 border-t border-[#EDE8DD] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                  <Clock className="w-3.5 h-3.5 text-[#8A7D67]" />
                  <span>{lastSavedAt ? `Last saved at ${lastSavedAt}` : 'All changes synced'}</span>
                </div>

                <div className="flex items-center gap-3">
                  {isLearningDirty && (
                    <button
                      type="button"
                      onClick={handleDiscardLearning}
                      disabled={saving}
                      className="h-9 px-4 rounded-full bg-white border border-[#EDE8DD] text-[12.5px] font-medium text-[#6B7280] hover:text-[#111814] hover:bg-[#FBF9F3] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    disabled={!isLearningDirty || saving}
                    className="h-9 px-5 rounded-full bg-[#1A221E] hover:bg-black text-white text-[12.5px] font-medium shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving changes...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SCHOOL & AFFILIATION (Admins Only) */}
        {isAdmin && activeTab === 'school' && (
          <div className="space-y-6 animate-fadeIn">
            {/* School Metrics Card */}
            <div className="rounded-[16px] bg-white border border-[#EDE8DD] card-shadow p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F8B] uppercase">
                    INSTITUTIONAL METRICS
                  </span>
                  <h2 className="text-[17px] font-[600] text-[#111814] mt-0.5">
                    {schoolData?.tenant_name || tenantName}
                  </h2>
                  <p className="text-[12.5px] text-[#6B7280]">
                    Campus license status, active teachers, and student headcounts.
                  </p>
                </div>
                <span className="font-mono text-[11px] px-3 py-1 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[#8A7D67]">
                  MULTI-TENANT ISOLATED
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-1">
                <div className="p-4 rounded-[14px] bg-[#FBF9F3] border border-[#EDE8DD]">
                  <div className="text-[11px] font-mono text-[#8A7D67] uppercase">Active Teachers</div>
                  <div className="text-[20px] font-bold text-[#111814] mt-1">
                    {schoolData?.teacher_count ?? '—'}
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-0.5">Authoring & Analytics</div>
                </div>

                <div className="p-4 rounded-[14px] bg-[#FBF9F3] border border-[#EDE8DD]">
                  <div className="text-[11px] font-mono text-[#8A7D67] uppercase">Enrolled Students</div>
                  <div className="text-[20px] font-bold text-[#111814] mt-1">
                    {schoolData?.student_count ?? '—'}
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-0.5">Active Learners</div>
                </div>

                <div className="p-4 rounded-[14px] bg-[#FBF9F3] border border-[#EDE8DD]">
                  <div className="text-[11px] font-mono text-[#8A7D67] uppercase">Class Sections</div>
                  <div className="text-[20px] font-bold text-[#111814] mt-1">
                    {schoolData?.sections?.length ?? data?.sections?.length ?? 0}
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-0.5">Classrooms Configured</div>
                </div>
              </div>
            </div>

            {/* CBSE Affiliation Form */}
            <div className="rounded-[16px] bg-white border border-[#EDE8DD] card-shadow p-6 space-y-5">
              <div>
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F8B] uppercase">
                  CBSE BOARD COMPLIANCE
                </span>
                <h2 className="text-[17px] font-[600] text-[#111814] mt-0.5">
                  Institutional Affiliation & Academic Term
                </h2>
                <p className="text-[12.5px] text-[#6B7280]">
                  Affiliation details printed on generated question papers and scorecards.
                </p>
              </div>

              <form onSubmit={handleSaveSchool} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#4A5568] mb-1.5">
                      CBSE Affiliation Code
                    </label>
                    <input
                      type="text"
                      value={cbseCode}
                      onChange={(e) => setCbseCode(e.target.value)}
                      placeholder="e.g. CBSE-DEL-1039"
                      className="w-full h-10 px-3.5 rounded-[12px] bg-white border border-[#EDE8DD] text-[13px] text-[#111814] font-mono outline-none focus:border-[#DDB56E] focus:ring-1 focus:ring-[#DDB56E] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#4A5568] mb-1.5">
                      Current Academic Year
                    </label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="e.g. 2026-2027"
                      className="w-full h-10 px-3.5 rounded-[12px] bg-white border border-[#EDE8DD] text-[13px] text-[#111814] outline-none focus:border-[#DDB56E] focus:ring-1 focus:ring-[#DDB56E] transition-all"
                    />
                  </div>
                </div>

                {/* Action Bar with Trust Signals & Dirty State */}
                <div className="pt-4 border-t border-[#EDE8DD] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                    <Clock className="w-3.5 h-3.5 text-[#8A7D67]" />
                    <span>{lastSavedAt ? `Last saved at ${lastSavedAt}` : 'All changes synced'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isSchoolDirty && (
                      <button
                        type="button"
                        onClick={handleDiscardSchool}
                        disabled={saving}
                        className="h-9 px-4 rounded-full bg-white border border-[#EDE8DD] text-[12.5px] font-medium text-[#6B7280] hover:text-[#111814] hover:bg-[#FBF9F3] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!isSchoolDirty || saving}
                      className="h-9 px-5 rounded-full bg-[#1A221E] hover:bg-black text-white text-[12.5px] font-medium shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? 'Saving changes...' : 'Save Institutional Settings'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
