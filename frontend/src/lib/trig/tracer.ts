import { getToken } from '../api'

/**
 * Trigonometry telemetry click-stream tracer. Sends non-blocking, lightweight
 * interaction events to this app's own /api/trig/telemetry/event (ported from
 * edova-pilot-v4's tracer.js, adapted to hit the app's own backend with the
 * app's own auth token instead of a separate hardcoded pilot backend URL).
 */
export const trackTelemetryEvent = (
  conceptId: string | undefined,
  stepIndex: number | undefined,
  eventType: string,
  eventPayload: Record<string, unknown> = {},
): void => {
  try {
    const token = getToken()
    const payload = {
      concept_id: conceptId || 'trig-101',
      step_index: stepIndex ?? 0,
      event_type: eventType,
      event_payload: eventPayload,
    }

    fetch('/api/trig/telemetry/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Non-blocking telemetry
    })
  } catch {
    // Non-blocking
  }
}
