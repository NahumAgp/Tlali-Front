import heroTlaliTlapixqui from '../../assets/hero-tlali-tlapixqui.png'
import TlaliIcon from '../brand/TlaliIcon.jsx'

export default function AboutPageTemplate({ content, navigate }) {
  return (
    <>
      <section className="tlali-container grid min-h-screen gap-10 pb-14 pt-32 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div>
          <p className="eyebrow">{content.eyebrow}</p>
          <h1 className="font-display mt-4 max-w-3xl text-5xl font-bold leading-[1.04] sm:text-6xl">{content.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-tlali-muted">{content.intro}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a className="primary-button min-h-12 px-6 text-sm" href="/#contacto">{content.primaryAction}</a>
            <button className="secondary-button min-h-12 px-6 text-sm" onClick={() => navigate('/')} type="button">{content.secondaryAction}</button>
          </div>
        </div>
        <figure className="tlali-frame overflow-hidden p-2">
          <img alt="Tlali Tlapixqui" className="aspect-[5/4] w-full rounded-[20px] object-cover object-center" src={heroTlaliTlapixqui} />
        </figure>
      </section>

      <section className="tlali-section border-y border-tlali-line bg-tlali-paper/75">
        <div className="tlali-container grid gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-start">
          <div>
            <p className="eyebrow">{content.storyEyebrow}</p>
            <h2 className="font-display mt-3 text-4xl font-bold tracking-tight">{content.storyTitle}</h2>
          </div>
          <div className="grid gap-4">
            {content.story.map((item) => <StoryRow key={item.title} text={item.text} title={item.title} />)}
          </div>
        </div>
      </section>

      <section className="tlali-section">
        <div className="tlali-container">
          <div className="grid gap-4 md:grid-cols-2">
            <StatementCard icon="target" text={content.missionText} title={content.missionTitle} />
            <StatementCard icon="leaf" text={content.visionText} title={content.visionTitle} />
          </div>
        </div>
      </section>

      <section className="tlali-section border-y border-tlali-line bg-[#f2e4cc]">
        <div className="tlali-container">
          <div className="max-w-3xl">
            <p className="eyebrow">{content.valuesEyebrow}</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{content.valuesTitle}</h2>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {content.values.map((item) => <ValueCard icon={item.icon} key={item.title} text={item.text} title={item.title} />)}
          </div>
        </div>
      </section>

      <section className="tlali-section">
        <div className="tlali-container grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <p className="eyebrow">{content.aiEyebrow}</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{content.aiTitle}</h2>
            <p className="mt-4 leading-7 text-tlali-muted">{content.aiText}</p>
          </div>
          <div className="paper-card p-5">
            <div className="flex items-center gap-4">
              <TlaliIcon name="message" />
              <div>
                <p className="font-display text-2xl font-bold">{content.aiCardTitle}</p>
                <p className="text-sm text-tlali-muted">{content.aiCardSubtitle}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {content.aiLines.map((item) => <DecisionLine key={item.label} label={item.label} value={item.value} />)}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function DecisionLine({ label, value }) {
  return <div className="grid gap-1 rounded-xl border border-tlali-line bg-tlali-paper px-4 py-3 sm:grid-cols-[150px_1fr]"><dt className="font-bold">{label}</dt><dd className="text-sm leading-6 text-tlali-muted">{value}</dd></div>
}

function StatementCard({ icon, text, title }) {
  return <article className="paper-card p-6"><TlaliIcon name={icon} /><h3 className="font-display mt-5 text-3xl font-bold">{title}</h3><p className="mt-3 leading-7 text-tlali-muted">{text}</p></article>
}

function StoryRow({ text, title }) {
  return <article className="border-t border-tlali-line py-5"><h3 className="font-display text-2xl font-bold">{title}</h3><p className="mt-2 leading-7 text-tlali-muted">{text}</p></article>
}

function ValueCard({ icon, text, title }) {
  return <article className="paper-card p-5"><TlaliIcon name={icon} /><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-tlali-muted">{text}</p></article>
}
