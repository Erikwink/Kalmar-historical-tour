import { createContext, useContext, useState, useEffect } from "react"
import i18n from '../languages/i18n'

const SettingsContext = createContext(null)

const SUPPORTED_LANGUAGES = ['sv', 'en']

function detectLanguage() {
  const lang = navigator.language.split('-')[0]
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'sv'
}

/**
 * Provides app-wide settings (theme, language, font size).
 * localStorage is used if set; otherwise falls back to OS/browser defaults.
 */
export function SettingsProvider({ children }) {
  const [theme, setThemeState] = useState(() =>
    localStorage.getItem('theme') ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )
  const [language, setLanguageState] = useState(() =>
    localStorage.getItem('language') ?? detectLanguage()
  )
  const [fontSize, setFontSizeState] = useState(() => localStorage.getItem('fontSize') || 'medium')

  /** 
   * Set theme in localstorage and in app. 
   * 
   * @param {'light'|'dark'} value 
   */
  function setTheme(value) {
    localStorage.setItem('theme', value)
    setThemeState(value)
  }

  /**
   * Set language in localstorage and in app. 
   * 
   * @param {'sv'|'en'} value
   */
  function setLanguage(value) {
    localStorage.setItem('language', value)
    i18n.changeLanguage(value)
    setLanguageState(value)
  }

  /** 
   * Set font size in localstorage and in app.  
   * 
   * @param {'small'|'medium'|'large'} value 
   */
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
import { createContext, useContext, useState, useEffect } from "react"
import i18n from '../languages/i18n'

const SettingsContext = createContext(null)

const SUPPORTED_LANGUAGES = ['sv', 'en']

function detectLanguage() {
  const lang = navigator.language.split('-')[0]
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'sv'
}

/**
 * Provides app-wide settings (theme, language, font size).
 * localStorage is used if set; otherwise falls back to OS/browser defaults.
 */
export function SettingsProvider({ children }) {
  const [theme, setThemeState] = useState(() =>
    localStorage.getItem('theme') ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )
  const [language, setLanguageState] = useState(() =>
    localStorage.getItem('language') ?? detectLanguage()
  )
  const [fontSize, setFontSizeState] = useState(() => localStorage.getItem('fontSize') || 'medium')

  /** 
   * Set theme in localstorage and in app. 
   * 
   * @param {'light'|'dark'} value 
   */
  function setTheme(value) {
    localStorage.setItem('theme', value)
    setThemeState(value)
  }

  /**
   * Set language in localstorage and in app. 
   * 
   * @param {'sv'|'en'} value
   */
  function setLanguage(value) {
    localStorage.setItem('language', value)
    i18n.changeLanguage(value)
    setLanguageState(value)
  }

  /** 
   * Set font size in localstorage and in app.  
   * 
   * @param {'small'|'medium'|'large'} value 
   */
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
