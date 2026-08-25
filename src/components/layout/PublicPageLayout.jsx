import LogoMark from '../brand/LogoMark.jsx'
import { LanguageToggle, useLanguage } from '../../i18n/LanguageContext.jsx'

export default function PublicPageLayout({ auth, children, navigate }) {
  const { t } = useLanguage()
  const dashboardPath = auth.token ? '/dashboard' : '/login'

  return (
    <div className="tlali-page min-h-screen overflow-x-hidden text-tlali-ink">
      <header className="fixed inset-x-0 top-4 z-30 px-4">
        <nav className="mx-auto flex max-w-[1240px] items-center justify-between gap-5 rounded-full border border-tlali-line bg-tlali-paper/90 px-6 py-4 shadow-lg shadow-[#142d25]/10 backdrop-blur">
          <button className="flex items-center gap-3 text-left" onClick={() => navigate('/')} type="button">
            <LogoMark variant="nav" />
            <span className="hidden sm:block">
              <span className="font-display block text-lg font-bold leading-tight">Tlali Tlapixqui</span>
              <span className="block text-[11px] text-tlali-muted">{t.common.tlaliTagline}</span>
            </span>
          </button>
          <div className="hidden items-center gap-7 text-sm font-bold text-tlali-muted md:flex">
            <a className="transition hover:text-tlali-red" href="/#producto">{t.common.product}</a>
            <a className="transition hover:text-tlali-red" href="/#beneficios">{t.common.benefits}</a>
            <button className="transition hover:text-tlali-red" onClick={() => navigate('/quienes-somos')} type="button">{t.common.whoWeAre}</button>
            <a className="transition hover:text-tlali-red" href="/#contacto">{t.common.contact}</a>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button className="px-2 py-2 text-sm font-bold text-tlali-jade-dark transition hover:text-tlali-red sm:px-3" onClick={() => navigate(dashboardPath)} type="button">
              {auth.token ? t.common.openPanel : t.common.login}
            </button>
          </div>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="border-t border-tlali-line bg-tlali-ink py-10 text-tlali-cream">
        <div className="tlali-container grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark />
              <div>
                <p className="font-display text-xl font-bold">Tlali Tlapixqui</p>
                <p className="text-xs text-[#c8d8d1]">{t.common.tlaliTagline}</p>
              </div>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#d8e7df]">{t.common.footerLine}</p>
          </div>
          <div className="text-sm text-[#d8e7df] md:text-right">
            <a className="font-bold text-white hover:text-[#f7ead4]" href="/#contacto">{t.common.contact}</a>
            <p className="mt-3">{t.common.allRights}</p>
            <p className="mt-1">© {new Date().getFullYear()} Tlali Tlapixqui.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
