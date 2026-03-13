import { createContext, useContext, useState, useEffect } from "react"

const SettingsContext = createContext(null)

/**
 * Provides app-wide settings (theme, language, font size).
 * Values are persisted to localStorage and applied as data-attributes on <html>.
 */
export function SettingsProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'dark')
  const [language, setLanguageState] = useState(() => localStorage.getItem('language') || 'sv')
  const [fontSize, setFontSizeState] = useState(() => localStorage.getItem('fontSize') || 'medium')

  /** @param {'light'|'dark'} value */
  function setTheme(value) {
    localStorage.setItem('theme', value)
    setThemeState(value)
  }

  /** @param {'sv'|'en'} value */
  function setLanguage(value) {
    localStorage.setItem('language', value)
    setLanguageState(value)
  }

  /** @param {'small'|'medium'|'large'} value */
  function setFontSize(value) {
    localStorage.setItem('fontSize', value)
    setFontSizeState(value)
  }

  // Apply theme token to <html> so CSS [data-theme] selectors respond
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Apply font size token to <html> so rem-based text scales accordingly
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize)
  }, [fontSize])

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage, fontSize, setFontSize }}>
      {children}
    </SettingsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  return useContext(SettingsContext)
}
