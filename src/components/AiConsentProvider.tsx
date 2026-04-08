'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AI_CONSENT_VERSION,
  getCachedConsent,
  setCachedConsent,
} from '@/lib/ai-consent'
import AiConsentModal from './AiConsentModal'

type AiConsentContextType = {
  requireConsent: () => Promise<boolean>
}

const AiConsentContext = createContext<AiConsentContextType>({
  requireConsent: () => Promise.resolve(false),
})

export function useAiConsent() {
  return useContext(AiConsentContext)
}

export default function AiConsentProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [showModal, setShowModal] = useState(false)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)
  const consentKnown = useRef(false)
  const consentGranted = useRef(false)

  // On mount, check cached consent
  useEffect(() => {
    if (getCachedConsent()) {
      consentKnown.current = true
      consentGranted.current = true
    }
  }, [])

  const checkSupabaseConsent = useCallback(async (): Promise<boolean> => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false
      const meta = user.user_metadata
      const granted =
        meta?.ai_consent_granted === true &&
        meta?.ai_consent_version === AI_CONSENT_VERSION
      if (granted) {
        setCachedConsent(true)
        consentGranted.current = true
      }
      consentKnown.current = true
      return granted
    } catch {
      return false
    }
  }, [])

  const requireConsent = useCallback(async (): Promise<boolean> => {
    // Fast path: already consented (cached)
    if (consentGranted.current) return true

    // Check Supabase if we haven't yet
    if (!consentKnown.current) {
      const granted = await checkSupabaseConsent()
      if (granted) return true
    }

    // Need to show modal
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setShowModal(true)
    })
  }, [checkSupabaseConsent])

  const handleAccept = useCallback(() => {
    setCachedConsent(true)
    consentGranted.current = true
    consentKnown.current = true
    setShowModal(false)
    resolverRef.current?.(true)
    resolverRef.current = null
  }, [])

  const handleDecline = useCallback(() => {
    setCachedConsent(false)
    consentKnown.current = true
    consentGranted.current = false
    setShowModal(false)
    resolverRef.current?.(false)
    resolverRef.current = null
  }, [])

  return (
    <AiConsentContext.Provider value={{ requireConsent }}>
      {children}
      {showModal && (
        <AiConsentModal onAccept={handleAccept} onDecline={handleDecline} />
      )}
    </AiConsentContext.Provider>
  )
}
