import { createContext, useContext, useMemo, useState } from 'react'
import { translations } from './translations.js'

const LANGUAGE_KEY = 'tlali_language'
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || 'otomi')

  function setAppLanguage(nextLanguage) {
    localStorage.setItem(LANGUAGE_KEY, nextLanguage)
    setLanguage(nextLanguage)
  }

  const value = useMemo(() => ({
    language,
    locale: language === 'es' ? 'es-MX' : 'es-MX',
    setLanguage: setAppLanguage,
    t: translations[language] ?? translations.otomi,
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}

export function LanguageToggle({ className = '' }) {
  const { language, setLanguage, t } = useLanguage()
  const nextLanguage = language === 'es' ? 'otomi' : 'es'

  return (
    <button className={className || 'px-2 py-2 text-sm font-black text-tlali-jade-dark transition hover:text-tlali-red sm:px-3'} onClick={() => setLanguage(nextLanguage)} type="button">
      {language === 'es' ? t.common.otomi : t.common.spanish}
    </button>
  )
}
