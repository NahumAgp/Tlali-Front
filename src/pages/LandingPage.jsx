import { useState } from 'react'
import heroTlaliTlapixqui from '../assets/hero-tlali-tlapixqui.png'
import TlaliIcon from '../components/brand/TlaliIcon.jsx'
import PublicPageLayout from '../components/layout/PublicPageLayout.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export default function LandingPage({ auth, navigate }) {
  const { t } = useLanguage()
  const [contactSent, setContactSent] = useState(false)
  const dashboardPath = auth.token ? '/dashboard' : '/login'
  const quickBenefits = [
    ['leaf', t.landing.quickOne, t.landing.quickOneText],
    ['bell', t.landing.quickTwo, t.landing.quickTwoText],
    ['chart', t.landing.quickThree, t.landing.quickThreeText],
  ]
  const productHighlights = [
    ['water', t.landing.waterTitle, t.landing.waterText],
    ['sun', t.landing.sunTitle, t.landing.sunText],
    ['brain', t.landing.aiAssistant, t.landing.aiAssistantText],
  ]
  const benefitCards = [
    ['shield', t.landing.benefitOne, t.landing.benefitOneText],
    ['clock', t.landing.benefitTwo, t.landing.benefitTwoText],
    ['users', t.landing.benefitThree, t.landing.benefitThreeText],
    ['sprout', t.landing.benefitFour, t.landing.benefitFourText],
  ]

  function handleContactSubmit(event) {
    event.preventDefault()
    setContactSent(true)
  }

  return (
    <PublicPageLayout auth={auth} navigate={navigate}>
      <section className="tlali-container grid min-h-screen gap-10 pb-14 pt-32 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
        <div className="max-w-3xl">
          <p className="eyebrow">{t.landing.heroEyebrow}</p>
          <h1 className="font-display mt-4 text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl">Tlali Tlapixqui</h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-tlali-ink">{t.landing.heroSubtitle}</p>
          <p className="mt-4 max-w-xl leading-7 text-tlali-muted">{t.landing.heroText}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="primary-button min-h-12 px-6 text-sm" onClick={() => navigate(dashboardPath)} type="button">{t.landing.ctaPanel}</button>
            <a className="secondary-button min-h-12 px-6 text-sm" href="#contacto">{t.landing.ctaInfo}</a>
          </div>
        </div>

        <figure className="tlali-frame overflow-hidden p-2">
          <img alt="Tlali Tlapixqui" className="aspect-[5/4] w-full rounded-[20px] object-cover object-center lg:aspect-[4/5]" src={heroTlaliTlapixqui} />
        </figure>
      </section>

      <section className="border-y border-tlali-line bg-tlali-paper/75 py-8">
        <div className="tlali-container grid gap-4 sm:grid-cols-3">
          {quickBenefits.map(([icon, title, text]) => <IconFact icon={icon} key={title} text={text} title={title} />)}
        </div>
      </section>

      <section className="tlali-section" id="producto">
        <div className="tlali-container">
          <div className="grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow">{t.common.product}</p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t.landing.productTitle}</h2>
            </div>
            <p className="max-w-2xl leading-7 text-tlali-muted">{t.landing.productText}</p>
          </div>

          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {productHighlights.map(([icon, title, text]) => <ImageFeature icon={icon} image={heroTlaliTlapixqui} key={title} text={text} title={title} />)}
          </div>
        </div>
      </section>

      <section className="tlali-section border-y border-tlali-line bg-[#f2e4cc]">
        <div className="tlali-container grid gap-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <div>
            <p className="eyebrow">{t.landing.aiAssistant}</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t.landing.aiCardTitle}</h2>
            <p className="mt-4 max-w-2xl leading-7 text-tlali-muted">{t.landing.aiAssistantText}</p>
          </div>
          <div className="paper-card p-5">
            <div className="flex items-center gap-4 border-b border-tlali-line pb-4">
              <TlaliIcon name="brain" />
              <div>
                <p className="font-display text-xl font-bold">{t.landing.aiCardTitle}</p>
                <p className="text-sm text-tlali-muted">{t.landing.aiCardSubtitle}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <AiMessage title={t.landing.aiSummary} text={t.landing.aiSummaryText} />
              <AiMessage title={t.landing.aiStep} text={t.landing.aiStepText} />
              <AiMessage title={t.landing.aiReport} text={t.landing.aiReportText} />
            </div>
          </div>
        </div>
      </section>

      <section className="tlali-section border-y border-tlali-line bg-[#f2e4cc]" id="beneficios">
        <div className="tlali-container">
          <div className="max-w-3xl">
            <p className="eyebrow">{t.common.benefits}</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t.landing.benefitsTitle}</h2>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefitCards.map(([icon, title, text]) => <BenefitCard icon={icon} key={title} text={text} title={title} />)}
          </div>
        </div>
      </section>

      <section className="tlali-section" id="contacto">
        <div className="tlali-container grid gap-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <div>
            <p className="eyebrow">{t.common.contact}</p>
            <h2 className="font-display mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">{t.landing.contactTitle}</h2>
            <p className="mt-5 max-w-2xl leading-7 text-tlali-muted">{t.landing.contactText}</p>
            <div className="mt-7 overflow-hidden rounded-2xl border border-tlali-line">
              <img alt="Tlali Tlapixqui" className="h-64 w-full object-cover object-center" src={heroTlaliTlapixqui} />
            </div>
          </div>

          <form className="paper-card p-5 sm:p-6" onSubmit={handleContactSubmit}>
            <h3 className="font-display text-2xl font-bold">{t.landing.requestInfo}</h3>
            <div className="mt-5 grid gap-3">
              <ContactInput label={t.common.formName} name="name" />
              <ContactInput label={t.common.email} name="contact" />
              <label className="grid gap-2 text-sm font-bold">
                {t.common.message}
                <textarea className="min-h-28 resize-none rounded-xl border border-tlali-line bg-tlali-paper px-3 py-3 font-normal outline-none transition focus:border-tlali-jade-dark focus:ring-4 focus:ring-[#69b8a5]/20" name="message" />
              </label>
            </div>
            <button className="primary-button mt-5 w-full" type="submit">{t.common.send}</button>
            {contactSent && <p className="mt-3 rounded-lg border border-[#cce0cf] bg-[#edf7ee] px-3 py-2 text-sm font-semibold text-tlali-jade-dark">{t.landing.infoSent}</p>}
          </form>
        </div>
      </section>
    </PublicPageLayout>
  )
}

function AiMessage({ text, title }) {
  return <article className="rounded-xl border border-tlali-line bg-tlali-paper px-4 py-3"><p className="text-sm font-bold">{title}</p><p className="mt-1 text-sm leading-6 text-tlali-muted">{text}</p></article>
}

function BenefitCard({ icon, text, title }) {
  return <article className="paper-card p-5"><TlaliIcon name={icon} /><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-tlali-muted">{text}</p></article>
}

function ContactInput({ label, name }) {
  return <label className="grid gap-2 text-sm font-bold">{label}<input className="tlali-input font-normal" name={name} required /></label>
}

function IconFact({ icon, text, title }) {
  return <article className="flex items-center gap-4 rounded-2xl border border-tlali-line bg-[#fff8ea] p-4"><TlaliIcon name={icon} /><div><h3 className="font-display text-xl font-bold">{title}</h3><p className="mt-1 text-sm text-tlali-muted">{text}</p></div></article>
}

function ImageFeature({ icon, image, text, title }) {
  return <article className="paper-card overflow-hidden"><img alt="" className="h-40 w-full object-cover object-center" src={image} /><div className="p-5"><TlaliIcon name={icon} /><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-tlali-muted">{text}</p></div></article>
}
