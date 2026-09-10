import { useEffect, useRef, useState } from 'react'
import CurriculumPage from './pages/CurriculumPage'
import AuthoringPage, { type AuthoringPageHandle } from './pages/AuthoringPage'
import CreateTestPage from './pages/CreateTestPage'
import LoginPage from './pages/LoginPage'
import { adminAuth, getAdminToken, setAdminToken, type AdminChapter, type AdminSession } from './lib/adminApi'

type PageId = 'curriculum' | 'authoring' | 'test'

const NAV: { id: PageId; icon: string; title: string; sub: string }[] = [
  { id: 'curriculum', icon: '▦', title: 'Curriculum View', sub: '6 cards grid' },
  { id: 'authoring', icon: '♧', title: 'Authoring Studio', sub: 'Create questions' },
  { id: 'test', icon: '▷', title: 'Create Test', sub: 'Build mock tests' },
]

const PAGE_HEADER: Record<PageId, [string, string, string]> = {
  curriculum: ['CURRICULUM', 'Curriculum Overview', 'Class • Subject • Chapter'],
  authoring: ['AUTHORING STUDIO', 'Authoring Studio', 'Create • Bank • Preview'],
  test: ['TEST BUILDER', 'Create Mock Test', 'Configure • Review • Publish'],
}

export default function App() {
  const [session, setSession] = useState<AdminSession | null | 'checking'>(getAdminToken() ? 'checking' : null)
  const [page, setPage] = useState<PageId>('curriculum')
  const [subjectId, setSubjectId] = useState('')
  const [chapter, setChapter] = useState<AdminChapter | null>(null)
  const authoringRef = useRef<AuthoringPageHandle>(null)

  useEffect(() => {
    if (session !== 'checking') return
    adminAuth.session().then(setSession).catch(() => { setAdminToken(null); setSession(null) })
  }, [session])

  if (session === 'checking') return null
  if (!session) return <LoginPage onLoggedIn={() => setSession('checking')} />

  const [eyebrow, title, subtitle] = PAGE_HEADER[page]

  function selectChapter(c: AdminChapter, target: 'authoring' | 'test') {
    setChapter(c)
    setPage(target)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="logo">E</div><div><b>EDOVA</b><small>CO-TEACHER</small></div></div>
        <nav className="nav">
          {NAV.map((n) => (
            <button key={n.id} className={page === n.id ? 'active' : ''} onClick={() => setPage(n.id)}>
              <div className="ico">{n.icon}</div>
              <div><strong>{n.title}</strong><small>{n.sub}</small></div>
            </button>
          ))}
        </nav>
        <div className="grow" />
        <div className="user"><div className="avatar">{session.full_name.slice(0, 2).toUpperCase()}</div><div><b>{session.full_name}</b><small>{session.tenant_name}</small></div></div>
      </aside>

      <main className="main">
        <header className="top">
          <div><div className="eyebrow">{eyebrow}</div><div className="title">{title}</div><div className="subtitle">{chapter ? chapter.name : subtitle}</div></div>
          <div className="topright">
            {page === 'authoring' && (
              <button className="add-new-question" onClick={() => authoringRef.current?.startNewQuestion()}>
                Add New Question
              </button>
            )}
            <button className="logout-btn" onClick={() => { setAdminToken(null); setSession(null) }}>Log out</button>
          </div>
        </header>
        <section className="content">
          {page === 'curriculum' && (
            <CurriculumPage
              subjectId={subjectId}
              onSelectSubject={setSubjectId}
              onSelectChapter={selectChapter}
            />
          )}
          {page === 'authoring' && (
            <AuthoringPage
              ref={authoringRef}
              subjectId={subjectId}
              chapterId={chapter?.id ?? ''}
              chapterName={chapter?.name ?? ''}
              onChangeChapter={(sid, c) => {
                setSubjectId(sid)
                setChapter(c)
              }}
            />
          )}
          {page === 'test' && <CreateTestPage chapterId={chapter?.id ?? ''} chapterName={chapter?.name ?? ''} />}
        </section>
      </main>
    </div>
  )
}
