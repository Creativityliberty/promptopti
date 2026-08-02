"use client"

import { useState, useEffect, useCallback } from "react"

// Event emitter pour synchroniser les changements entre composants
const localStorageEventTarget = new EventTarget()

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Initialize the state
  useEffect(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key)
      // Parse stored json or if none return initialValue
      const value = item ? JSON.parse(item) : initialValue
      setStoredValue(value)
    } catch (error) {
      // If error also return initialValue
      console.error(error)
      setStoredValue(initialValue)
    }
  }, [key, initialValue])

  // Listen for changes from other components
  useEffect(() => {
    const handleStorageChange = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail.key === key) {
        setStoredValue(customEvent.detail.value)
      }
    }

    localStorageEventTarget.addEventListener("storage-change", handleStorageChange)

    return () => {
      localStorageEventTarget.removeEventListener("storage-change", handleStorageChange)
    }
  }, [key])

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        // Save state
        setStoredValue(valueToStore)
        // Save to local storage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))

          // Emit event to notify other components
          const event = new CustomEvent("storage-change", {
            detail: { key, value: valueToStore },
          })
          localStorageEventTarget.dispatchEvent(event)
        }
      } catch (error) {
        // A more advanced implementation would handle the error case
        console.error(error)
      }
    },
    [key, storedValue],
  )

  return [storedValue, setValue] as const
}
