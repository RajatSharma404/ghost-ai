"use client"

import { useState, useEffect, useRef, useCallback } from "react"

// Ambient types for Web Speech API
interface ISpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export interface UseVoiceDictationOptions {
  onTranscript?: (fullSessionTranscript: string, isFinal: boolean) => void
  lang?: string
  continuous?: boolean
  interimResults?: boolean
}

export function useVoiceDictation({
  onTranscript,
  lang = "en-US",
  continuous = true,
  interimResults = true,
}: UseVoiceDictationOptions = {}) {
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  })
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) return

    const recognition = new SpeechRec()
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = lang

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        setIsListening(false)
        return
      }
      setError(event.error || "Speech recognition error")
      setIsListening(false)
    }

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let sessionTranscript = ""
      let hasFinal = false

      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i]
        if (item && item[0]) {
          sessionTranscript += item[0].transcript
          if (item.isFinal) {
            hasFinal = true
          }
        }
      }

      if (onTranscriptRef.current) {
        onTranscriptRef.current(sessionTranscript, hasFinal)
      }
    }

    recognitionRef.current = recognition

    return () => {
      try {
        recognition.abort()
      } catch {}
      recognitionRef.current = null
    }
  }, [continuous, interimResults, lang])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    setError(null)
    try {
      recognitionRef.current.start()
    } catch {
      // Catch possible "already started" or DOMExceptions
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch {}
    setIsListening(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isSupported,
    isListening,
    error,
    startListening,
    stopListening,
    toggleListening,
  }
}
