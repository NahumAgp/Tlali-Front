import AboutPageTemplate from '../components/about/AboutPageTemplate.jsx'
import PublicPageLayout from '../components/layout/PublicPageLayout.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

const aboutContent = {
  otomi: {
    eyebrow: 'Toho ga xi',
    title: 'Tlali Tlapixqui: ra mfadi pa ra hai ne ra juadi',
    intro: 'Ga hoki nʼa mpefi pa da faxa ya mboñho da handi ra juadi, da beni hoga ne da hñaki ra dehe, ra hai ne ra producción.',
    primaryAction: 'Da ñahe',
    secondaryAction: 'Ma ra mudi',
    storyEyebrow: 'Ra mudi',
    storyTitle: 'Te bi mudi ra mpefi',
    story: [
      { title: 'Ra hai di ña', text: 'Ra juadi di unga ya seña. Tlali Tlapixqui di hñoki ya seña ne di hoki hoga pa ra mboñho.' },
      { title: 'Ra mfadi di faxa', text: 'Hin ga ne nʼa xudi thogi. Ga ne nʼa herramienta hoga, facil ne útil pa ra pa.' },
      { title: 'Ra hmuntsʼi di ñudi', text: 'Ra productor, ra tecnología ne ra IA di pefi nʼa thogi: hñaki ra juadi.' },
    ],
    missionTitle: 'Ra mpefi',
    missionText: 'Da zoni ra mfadi hoga pa ya mboñho, ko ya xifi claros ne ya ntʼudi pa da hoki ra cuidado ra juadi.',
    visionTitle: 'Ra thogi ga ne',
    visionText: 'Da hoki ra monitoreo mas cercano, mas humano ne mas facil pa ya invernaderos.',
    valuesEyebrow: 'Ya hoki',
    valuesTitle: 'Te di hoki Tlali Tlapixqui',
    values: [
      { icon: 'heart', title: 'Cerca ra mboñho', text: 'Di mudi ko ra necesidad real ra productor.' },
      { icon: 'leaf', title: 'Hñaki ra hai', text: 'Ra tecnología di faxa da hñaki ra dehe, ra hai ne ra producción.' },
      { icon: 'users', title: 'Facil pa ra hmuntsʼi', text: 'Ra mfadi di ña ko palabras sencillas.' },
    ],
    aiEyebrow: 'Ra xifi IA',
    aiTitle: 'Nʼa asistente pa da handi ne da beni',
    aiText: 'Ra asistente Tlali di handi ya xifi, di resume te bi thogi ne di sugiere te da hoki. Hin di padi ra experiencia ra productor; di faxa da beni hoga.',
    aiCardTitle: 'Asistente Tlali',
    aiCardSubtitle: 'Mʼui, xifi ne ntʼudi',
    aiLines: [
      { label: 'Te di handi', value: 'Däthe, ambiente, riego ne cambios recientes' },
      { label: 'Te di unga', value: 'Resumen claro ne ya xifi' },
      { label: 'Te pa', value: 'Da mudi ya acciones ra pa' },
    ],
  },
  es: {
    eyebrow: 'Quiénes somos',
    title: 'Tlali Tlapixqui: tecnología para cuidar la tierra y el cultivo',
    intro: 'Creamos una herramienta para ayudar a productores a revisar su cultivo, tomar mejores decisiones y cuidar agua, suelo y producción con más claridad.',
    primaryAction: 'Hablar con nosotros',
    secondaryAction: 'Volver al inicio',
    storyEyebrow: 'Nuestra historia',
    storyTitle: 'Por qué nace Tlali Tlapixqui',
    story: [
      { title: 'El campo ya habla', text: 'Cada cultivo muestra señales. Tlali Tlapixqui ayuda a ordenar esas señales para que el productor pueda entenderlas rápido.' },
      { title: 'Tecnología sin complicar', text: 'No buscamos llenar el trabajo de tecnicismos. Buscamos una herramienta clara, práctica y útil para todos los días.' },
      { title: 'Productor, datos e IA', text: 'Unimos experiencia de campo, monitoreo e inteligencia artificial para acompañar decisiones sin reemplazar al productor.' },
    ],
    missionTitle: 'Misión',
    missionText: 'Acercar monitoreo claro y accesible a productores, con avisos simples y seguimiento que ayude a cuidar mejor el cultivo.',
    visionTitle: 'Visión',
    visionText: 'Hacer que el monitoreo agrícola sea más cercano, humano y fácil de adoptar en invernaderos y parcelas.',
    valuesEyebrow: 'Valores',
    valuesTitle: 'Lo que guía a Tlali Tlapixqui',
    values: [
      { icon: 'heart', title: 'Cercanía al productor', text: 'Partimos de necesidades reales del trabajo agrícola.' },
      { icon: 'leaf', title: 'Respeto por la tierra', text: 'La tecnología debe ayudar a cuidar agua, suelo y producción.' },
      { icon: 'users', title: 'Fácil para el equipo', text: 'La información se presenta con palabras sencillas y accionables.' },
    ],
    aiEyebrow: 'Agente de IA',
    aiTitle: 'Un asistente para monitorear y decidir',
    aiText: 'El Asistente Tlali revisa alertas, resume cambios y sugiere siguientes pasos. No reemplaza la experiencia del productor; la acompaña para decidir con más seguridad.',
    aiCardTitle: 'Asistente Tlali',
    aiCardSubtitle: 'Monitoreo, alertas y recomendaciones',
    aiLines: [
      { label: 'Qué revisa', value: 'Humedad, ambiente, riego y cambios recientes' },
      { label: 'Qué entrega', value: 'Resumen claro y alertas fáciles de entender' },
      { label: 'Para qué sirve', value: 'Ayuda a priorizar acciones durante el día' },
    ],
  },
}

export default function WhoWeArePage({ auth, navigate }) {
  const { language } = useLanguage()
  const content = aboutContent[language] ?? aboutContent.otomi

  return (
    <PublicPageLayout auth={auth} navigate={navigate}>
      <AboutPageTemplate content={content} navigate={navigate} />
    </PublicPageLayout>
  )
}
