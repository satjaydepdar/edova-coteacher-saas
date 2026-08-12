import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Hls from 'hls.js'
import { ArrowLeft, ExternalLink, ListChecks, Lock, Maximize, Minimize } from 'lucide-react'
import { api, ApiError, type Module, type ModuleType } from '../lib/api'
import { useApp } from '../store'

interface Located extends Module {
  chapter_name: string
  topic_name: string
  subject_name: string
}

/** Locate a module across every subject shelf the device can see. */
async function locateModule(moduleId: string, subjectIds: string[]): Promise<Located | null> {
  for (const sid of subjectIds) {
    try {
      const tree = await api.tree(sid)
      for (const c of tree.chapters) {
        for (const t of c.topics) {
          const hit = t.modules.find((m) => m.module_id === moduleId)
          if (hit) {
            return {
              ...hit,
              chapter_name: c.chapter_name,
              topic_name: t.topic_name ?? 'General',
              subject_name: tree.subject_name,
            }
          }
        }
      }
    } catch {
      /* shelf not visible to this tenant — skip */
    }
  }
  return null
}

function VideoPlayer({ moduleId }: { moduleId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    let hls: Hls | null = null
    let blobUrl: string | null = null
    let cancelled = false
    let beatTimer: number | undefined
    let lastBeatWall: number | null = null // Date.now() of last counted beat while playing
    let refetched = false // one manifest refetch on fatal network error (expired presigned URLs)

    const sendBeat = () => {
      const v = videoRef.current
      if (!v || !v.duration || lastBeatWall === null) return
      const delta = Math.round((Date.now() - lastBeatWall) / 1000)
      lastBeatWall = Date.now()
      if (delta <= 0) return
      const pct = Math.min(100, Math.round((v.currentTime / v.duration) * 100))
      api.postProgress(moduleId, pct, delta, crypto.randomUUID()).catch(() => {
        /* heartbeat loss is tolerable — the next tick re-syncs pct */
      })
    }

    const attach = (m3u8: string) => {
      if (cancelled) return
      blobUrl = URL.createObjectURL(new Blob([m3u8], { type: 'application/vnd.apple.mpegurl' }))
      const video = videoRef.current
      if (!video) return
      if (Hls.isSupported()) {
        hls = new Hls()
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return
          // Segments are presigned (4h TTL); a very long pause can still outlive it.
          // Refetch the manifest once and resume from the current position.
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && !refetched) {
            refetched = true
            const resumeAt = video.currentTime
            api.videoManifest(moduleId).then((fresh) => {
              if (cancelled || !hls) return
              if (blobUrl) URL.revokeObjectURL(blobUrl)
              blobUrl = URL.createObjectURL(new Blob([fresh], { type: 'application/vnd.apple.mpegurl' }))
              hls.loadSource(blobUrl)
              video.currentTime = resumeAt
              void video.play().catch(() => {})
            }).catch(() => setError('Video segments could not be loaded from storage.'))
          } else {
            setError('Video segments could not be loaded from storage.')
          }
        })
        hls.loadSource(blobUrl)
        hls.attachMedia(video)
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = blobUrl
      } else {
        setError('This browser cannot play HLS video.')
        return
      }
      setLoading(false)

      // Resume (requirement §9 "resume playback where appropriate"): pct * duration.
      video.addEventListener('loadedmetadata', function onMeta() {
        video.removeEventListener('loadedmetadata', onMeta)
        api.moduleProgress(moduleId).then((p) => {
          if (!cancelled && p.progress_pct >= 2 && p.progress_pct < 95 && video.duration) {
            video.currentTime = (p.progress_pct / 100) * video.duration
          }
        }).catch(() => {})
      })

      // Heartbeats: 15s cadence while playing; final beat on pause. The server
      // marks VIDEO completed at >= 90%; time deltas are wall-clock watch time.
      video.addEventListener('play', () => { lastBeatWall = Date.now() })
      video.addEventListener('pause', sendBeat)
      beatTimer = window.setInterval(() => {
        const v = videoRef.current
        if (v && !v.paused && !v.seeking) sendBeat()
      }, 15_000)
    }

    api
      .videoManifest(moduleId)
      .then(attach)
      .catch((e) => {
        if (cancelled) return
        setLoading(false)
        if (e instanceof ApiError && e.status === 404) setError('Video content not published yet.')
        else if (e instanceof ApiError && e.status === 403) setError('Video access is not included in your plan.')
        else setError('Could not load the video manifest.')
      })

    return () => {
      cancelled = true
      sendBeat() // unmount during playback still counts the last stretch
      clearInterval(beatTimer)
      hls?.destroy()
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [moduleId])

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  return (
    <div
      ref={wrapRef}
      className="relative aspect-video bg-black rounded-[18px] overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.4)]"
    >
      {error ? (
        <div className="absolute inset-0 bg-gradient-to-br from-inkLight to-black flex items-center justify-center">
          <div className="text-center px-6">
            <Lock className="w-6 h-6 text-white/40 mx-auto mb-3" />
            <p className="text-white font-medium font-display text-[15px]">{error}</p>
            <p className="text-white/50 text-[12px] mt-1">Check back once the content team publishes it.</p>
          </div>
        </div>
      ) : (
        <>
          <video ref={videoRef} controls className="absolute inset-0 w-full h-full" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </>
      )}
      <button
        onClick={() => {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
          else wrapRef.current?.requestFullscreen?.().catch(() => {})
        }}
        className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center backdrop-blur transition-colors text-white"
      >
        {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </button>
    </div>
  )
}

function LabView({ moduleId }: { moduleId: string }) {
  const [instructions, setInstructions] = useState<string | null>(null)
  const [simUrl, setSimUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .labPayload(moduleId)
      .then((p) => setInstructions(p.instructions_markdown))
      .catch((e) =>
        setError(
          e instanceof ApiError && e.status === 404
            ? 'Lab content not published yet.'
            : 'Could not load lab instructions.',
        ),
      )
    api
      .labSimulation(moduleId)
      .then((s) => setSimUrl(s.simulation_url))
      .catch(() => {}) // no simulation file uploaded — instructions still render
  }, [moduleId])

  if (error) {
    return (
      <div className="bg-white rounded-[16px] border border-black/[0.06] p-8 text-center">
        <p className="text-[14px] font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {simUrl && (
        <div className="bg-white rounded-[16px] border border-black/[0.06] overflow-hidden">
          <div className="h-10 px-4 flex items-center justify-between border-b border-black/5 bg-paper">
            <span className="text-[13px] font-semibold">Simulation</span>
            <a
              href={simUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-medium flex items-center gap-1 opacity-70 hover:opacity-100"
            >
              Open in new tab <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <iframe title="Lab simulation" src={simUrl} className="w-full aspect-[16/10] bg-white" />
        </div>
      )}
      <div className="bg-white rounded-[16px] border border-black/[0.06] p-5">
        <div className="text-[12px] font-semibold mb-2">Lab instructions</div>
        {instructions === null ? (
          <span className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin inline-block" />
        ) : (
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap opacity-80">
            {instructions || 'No instructions published.'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function ModuleDetail() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const subjects = useApp((s) => s.subjects)
  const [mod, setMod] = useState<Located | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!moduleId || subjects.length === 0) return
    locateModule(moduleId, subjects.map((s) => s.id)).then((m) =>
      m ? setMod(m) : setNotFound(true),
    )
  }, [moduleId, subjects])

  return (
    <div className="p-3 lg:p-5 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-2 mb-3 text-[12px]">
        <Link
          to="/"
          className="flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-white border border-black/10 hover:bg-black/[0.03] transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to shelf
        </Link>
        <span className="opacity-30">/</span>
        <span className="opacity-60 truncate">
          {mod ? `${mod.chapter_name} • ${mod.type}` : '…'}
        </span>
      </div>

      {notFound && (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-10 text-center">
          <p className="text-[14px] font-medium">Module not found</p>
          <p className="text-[12px] opacity-60 mt-1">
            It may be unpublished or belong to another school's shelf.
          </p>
        </div>
      )}

      {!mod && !notFound && (
        <div className="flex justify-center pt-24">
          <span className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        </div>
      )}

      {mod && (
        <div className="space-y-4">
          {mod.type === 'VIDEO' && <VideoPlayer moduleId={mod.module_id} />}
          {mod.type === 'LAB' && <LabView moduleId={mod.module_id} />}
          {mod.type === 'QUIZ' && (
            <Link
              to={`/practice?module=${mod.module_id}`}
              className="block bg-ink rounded-[18px] p-5 text-white hover:bg-inkLight transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display font-semibold flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-gold" /> This is a quiz module
                  </div>
                  <div className="text-[12px] opacity-60 mt-1">
                    Open it in Practice Questions to generate a question set.
                  </div>
                </div>
                <span className="h-9 px-4 rounded-full bg-gold text-black text-[13px] font-semibold flex items-center">
                  Open
                </span>
              </div>
            </Link>
          )}

          <div className="bg-white rounded-[16px] border border-black/[0.06] p-4">
            <h3 className="font-display font-bold text-[16px] leading-tight">{mod.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-cream border border-black/5 font-medium">
                {mod.subject_name}
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-cream border border-black/5">
                {mod.chapter_name}
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-ink text-white">
                {mod.type}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
