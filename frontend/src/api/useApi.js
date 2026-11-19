import { useCallback, useEffect, useRef, useState } from 'react'

// useApi(() => api.get('/api/x'))         -> loads once
// useApi(() => api.get('/api/x'), 5000)   -> reloads every 5 seconds
export default function useApi(fetcher, refreshMs = 0) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const load = useCallback(async () => {
    try {
      setData(await fetcherRef.current())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    if (!refreshMs) return
    const timer = setInterval(load, refreshMs)
    return () => clearInterval(timer)
  }, [load, refreshMs])

  return { data, error, loading, reload: load }
}