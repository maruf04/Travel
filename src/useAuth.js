import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Who is signed in, what they may do, and (for admins) how many accounts are waiting for approval.
//   role: 'admin' | 'member' | 'pending' | 'declined' | 'none' | null (still loading)
export function useAuth() {
  const [session, setSession] = useState(supabase ? undefined : null) // undefined = still checking
  const [role, setRole] = useState(null)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id
  useEffect(() => {
    if (!userId) {
      setRole(null)
      return
    }
    supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => setRole(data?.role || 'none'))
  }, [userId])

  // admins: number of accounts waiting for approval (refreshed every minute)
  useEffect(() => {
    if (role !== 'admin') {
      setPending(0)
      return
    }
    const count = () =>
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('role', 'pending')
        .then(({ count: n }) => setPending(n || 0))
    count()
    const t = setInterval(count, 60000)
    return () => clearInterval(t)
  }, [role])

  return {
    enabled: Boolean(supabase),
    session,
    role,
    pending,
    loading: session === undefined || (Boolean(session) && role === null),
  }
}
