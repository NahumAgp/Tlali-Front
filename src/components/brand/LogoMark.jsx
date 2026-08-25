import tlaliLogo from '../../assets/tlali-logo.svg'
import tlaliEmblem from '../../assets/tlali-emblem.svg'

export default function LogoMark({ variant = 'default' }) {
  if (variant === 'nav') {
    return (
      <span className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#d6cbb6] bg-[#fffaf1] shadow-sm">
        <img alt="Tlali Tlapixqui" className="h-full w-full object-contain" src={tlaliEmblem} />
      </span>
    )
  }

  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#d6cbb6] bg-[#fffaf1] shadow-sm">
      <img alt="Tlali Tlapixqui" className="h-full w-full object-cover" src={tlaliLogo} />
    </span>
  )
}
