import {
  CultivationCard,
  DashboardNav,
  RecentActivity,
} from '../components/dashboard/DashboardWidgets.jsx'
import useDashboardData from '../hooks/useDashboardData.js'

export default function CultivoPage({ auth, navigate, route }) {
  const {
    activeCrop,
    cultivationNode,
    downloadReport,
    latest,
    message,
    readings,
    status,
    todayReadings,
  } = useDashboardData(auth)
  const registrosDelDia = todayReadings.length ? todayReadings : readings

  return (
    <div className="dashboard-shell min-h-screen text-tlali-ink">
      <DashboardNav auth={auth} downloadReport={downloadReport} hasReadings={registrosDelDia.length > 0} navigate={navigate} route={route} />
      <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-7 lg:px-10 lg:py-7">
        <section className="paper-card px-5 py-6 sm:px-7">
          <p className="eyebrow">Cultivo</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Suelo y luminosidad</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-tlali-muted sm:text-base">
            Revisa humedad, temperatura, luz y nutrientes de forma clara para tomar decisiones rápidas.
          </p>
        </section>

        {message && (
          <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${status === 'offline' ? 'border-red-200 bg-red-50 text-red-800' : 'border-tlali-line bg-tlali-paper text-tlali-muted'}`}>
            {message}
          </div>
        )}

        <section className="mt-4">
          <CultivationCard cropParameters={activeCrop?.parameters} firebaseNode={cultivationNode} fullWidth latest={latest} readings={registrosDelDia} />
        </section>

        <section className="mt-4">
          <RecentActivity readings={registrosDelDia} />
        </section>
      </div>
    </div>
  )
}
