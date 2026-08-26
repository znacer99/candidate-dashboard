const CACHE_KEY_CANDIDATES = 'candidate_portal_cached_candidates'
const CACHE_KEY_JOBS = 'candidate_portal_cached_jobs'
const QUEUE_KEY = 'candidate_portal_pending_actions'

/**
 * Save candidate list to local storage
 */
export function saveCachedCandidates(candidates) {
  try {
    if (Array.isArray(candidates)) {
      localStorage.setItem(CACHE_KEY_CANDIDATES, JSON.stringify({
        timestamp: Date.now(),
        data: candidates
      }))
    }
  } catch (err) {
    console.warn('Failed to save candidates to local cache:', err)
  }
}

/**
 * Load cached candidate list from local storage
 */
export function getCachedCandidates() {
  try {
    const raw = localStorage.getItem(CACHE_KEY_CANDIDATES)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.data || null
  } catch (err) {
    console.warn('Failed to load cached candidates:', err)
    return null
  }
}

/**
 * Save job offers to local storage
 */
export function saveCachedJobs(jobs) {
  try {
    if (Array.isArray(jobs)) {
      localStorage.setItem(CACHE_KEY_JOBS, JSON.stringify({
        timestamp: Date.now(),
        data: jobs
      }))
    }
  } catch (err) {
    console.warn('Failed to save jobs to local cache:', err)
  }
}

/**
 * Load cached job offers from local storage
 */
export function getCachedJobs() {
  try {
    const raw = localStorage.getItem(CACHE_KEY_JOBS)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.data || null
  } catch (err) {
    console.warn('Failed to load cached jobs:', err)
    return null
  }
}

/**
 * Queue an offline action (e.g. status change) to execute when reconnected
 */
export function queueOfflineAction(action) {
  try {
    const queue = getPendingOfflineActions()
    queue.push({
      ...action,
      timestamp: Date.now()
    })
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch (err) {
    console.warn('Failed to queue offline action:', err)
  }
}

/**
 * Get all queued offline actions
 */
export function getPendingOfflineActions() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw) || []
  } catch (err) {
    return []
  }
}

/**
 * Clear queued offline actions
 */
export function clearPendingOfflineActions() {
  try {
    localStorage.removeItem(QUEUE_KEY)
  } catch (err) {
    console.warn('Failed to clear pending offline actions:', err)
  }
}

/**
 * Process queued actions against Supabase when internet returns
 */
export async function syncPendingActions(supabaseClient) {
  const pending = getPendingOfflineActions()
  if (pending.length === 0) return 0

  let successCount = 0
  const remaining = []

  for (const item of pending) {
    try {
      if (item.type === 'UPDATE_STATUS') {
        const { error } = await supabaseClient
          .from('candidates')
          .update({ status: item.newStatus })
          .eq('id', item.candidateId)

        if (error) throw error
        successCount++
      } else if (item.type === 'UPDATE_CANDIDATE') {
        const { error } = await supabaseClient
          .from('candidates')
          .update(item.payload)
          .eq('id', item.candidateId)

        if (error) throw error
        successCount++
      }
    } catch (err) {
      console.error('Failed to sync action to Supabase:', item, err)
      remaining.push(item)
    }
  }

  if (remaining.length > 0) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
  } else {
    clearPendingOfflineActions()
  }

  return successCount
}
