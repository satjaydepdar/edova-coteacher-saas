/**
 * Video Generation Pipeline Client for Edova Co-Teacher.
 * Integrates with /api/video backend proxy and Video Factory Engine.
 */
import { getToken } from './api'

export interface VideoGenerateRequest {
  problemType?: string
  question?: string
  parameters?: Record<string, any>
  videoId?: string
  forceRefresh?: boolean
}

export interface VideoJobResponse {
  jobId: string
  videoId: string
  status: 'QUEUED' | 'SYNTHESIZING_AUDIO' | 'RENDERING_VIDEO' | 'READY' | 'FAILED'
  progress: number
  currentStage: string
  error?: string
  videoUrl?: string
  cached?: boolean
  storyboard?: any
}

export const videoApi = {
  /** Checks engine availability */
  health: async (): Promise<{ status: string; engine?: string; detail?: string }> => {
    try {
      const res = await fetch('/api/video/health')
      return await res.json()
    } catch (err: any) {
      return { status: 'offline', detail: err.message }
    }
  },

  /** Dispatches an on-demand video generation job */
  generate: async (req: VideoGenerateRequest): Promise<VideoJobResponse> => {
    const token = getToken()
    const res = await fetch('/api/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(req),
    })
    if (!res.ok) {
      let detail = res.statusText
      try {
        detail = (await res.json()).detail || detail
      } catch {}
      throw new Error(`Video Generation Error: ${detail}`)
    }
    return await res.json()
  },

  /** Polls the status of an ongoing video job */
  status: async (jobId: string): Promise<VideoJobResponse> => {
    const res = await fetch(`/api/video/status/${encodeURIComponent(jobId)}`)
    if (!res.ok) {
      throw new Error(`Failed to fetch job status: ${res.statusText}`)
    }
    return await res.json()
  },

  /** Returns storyboard scene metadata */
  storyboard: async (videoId: string): Promise<any> => {
    const res = await fetch(`/api/video/storyboard/${encodeURIComponent(videoId)}`)
    if (!res.ok) {
      throw new Error('Storyboard not found')
    }
    return await res.json()
  },

  /** Continuous poll helper that runs until READY or FAILED */
  pollUntilComplete: async (
    jobId: string,
    onProgress?: (job: VideoJobResponse) => void,
    intervalMs = 1000,
    maxAttempts = 120
  ): Promise<VideoJobResponse> => {
    let attempts = 0
    while (attempts < maxAttempts) {
      const job = await videoApi.status(jobId)
      if (onProgress) onProgress(job)

      if (job.status === 'READY') {
        return job
      }
      if (job.status === 'FAILED') {
        throw new Error(job.error || 'Video rendering failed on engine')
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs))
      attempts++
    }
    throw new Error('Timed out waiting for video generation to complete')
  },

  /** Returns stream URL for HTML5 video element */
  getStreamUrl: (videoId: string): string => {
    return `/api/video/stream/${encodeURIComponent(videoId)}`
  },

  /** Saves generated on-demand video to S3 under 'Ondemand videos/' */
  saveOndemand: async (payload: {
    videoId: string
    problemType?: string
    question?: string
    parameters?: Record<string, any>
    fileName?: string
    metadata?: Record<string, any>
  }): Promise<{ status: string; s3_bucket: string; s3_folder: string; s3_key: string; file_name: string }> => {
    const token = getToken()
    const res = await fetch('/api/video/save-ondemand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      throw new Error(`Failed to save on-demand video: ${res.statusText}`)
    }
    return await res.json()
  },
}

