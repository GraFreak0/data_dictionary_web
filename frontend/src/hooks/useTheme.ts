import { useState, useEffect, useCallback } from 'react'
import type { ThemeMode } from '../types'

const THEME_KEY = 'data-dictionary-theme'

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    return null
  } catch {
    return null
  }
}

function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = getStoredTheme()
    return stored ?? getSystemTheme()
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      const stored = getStoredTheme()
      if (!stored) {
        const newTheme: ThemeMode = e.matches ? 'dark' : 'light'
        setThemeState(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = useCallback((newTheme: ThemeMode) => {
    localStorage.setItem(THEME_KEY, newTheme)
    setThemeState(newTheme)
    applyTheme(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  }
}
