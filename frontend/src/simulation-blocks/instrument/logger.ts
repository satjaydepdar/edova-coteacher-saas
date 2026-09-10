export function logEvent(e: any) {
  try {
    const key = 'edova_logs'
    const logs = JSON.parse(localStorage.getItem(key) || '[]')
    logs.push(e)
    localStorage.setItem(key, JSON.stringify(logs.slice(-2000)))
  } catch {}

  // Asynchronous non-blocking backend telemetry ingestion
  try {
    fetch('http://localhost:8000/api/telemetry/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        simulation_id: e.blockId || e.simulationId || 'edova-sim',
        event_type: e.type || 'interaction',
        payload: e,
        user_id: e.userId || 'student-dharshini',
        attempt_id: e.attemptId || `att-${Date.now()}`
      })
    }).catch(() => {})
  } catch {}
}
