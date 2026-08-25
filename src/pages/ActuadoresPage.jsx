import {
  ActuatorCard,
  DashboardNav,
  RecentActivity,
} from '../components/dashboard/DashboardWidgets.jsx'
import useDashboardData from '../hooks/useDashboardData.js'

export default function ActuadoresPage({ auth, navigate, route }) {
  const {
    actuatorNode,
    actuatorReadings,
    downloadReport,
    lastReceivedAt,
    liveSource,
    message,
    status,
    todayActuatorReadings,
  } = useDashboardData(auth)
  const registrosDelDia = todayActuatorReadings.length ? todayActuatorReadings : actuatorReadings

  return (
    <div className="dashboard-shell min-h-screen text-tlali-ink">
      <DashboardNav auth={auth} downloadReport={downloadReport} hasReadings={registrosDelDia.length > 0} navigate={navigate} route={route} />
      <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-7 lg:px-10 lg:py-7">
        <section className="paper-card px-5 py-6 sm:px-7">
          <p className="eyebrow">Actuadores</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Riego y cisternas</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-tlali-muted sm:text-base">
            Consulta relevadores, distancia de cisternas, pH, TDS y señal del sistema de riego.
          </p>
        </section>

        {message && (
          <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${status === 'offline' ? 'border-red-200 bg-red-50 text-red-800' : 'border-tlali-line bg-tlali-paper text-tlali-muted'}`}>
            {message}
          </div>
        )}

        <section className="mt-4">
          <ActuatorCard fullWidth node={actuatorNode} />
        </section>

        <section className="mt-4">
          <RecentActivity readings={registrosDelDia} type="actuadores" />
        </section>

        <p className="mt-5 border-t border-tlali-line pt-5 text-xs text-tlali-muted">
          {lastReceivedAt ? `Última sincronización ${new Date(lastReceivedAt).toLocaleString('es-MX')} · ${liveSource ? 'Firebase' : 'Local'}` : 'Esperando señal'}
        </p>
      </div>
    </div>
  )
}
