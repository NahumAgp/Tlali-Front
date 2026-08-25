export default function TlaliIcon({ name }) {
  const paths = {
    bell: <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-4-5.7V4a2 2 0 1 0-4 0v1.3A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0" />,
    brain: <path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a4 4 0 0 0 4 4h1V3H9Zm6 0a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a4 4 0 0 1-4 4h-1V3h2Z" />,
    chart: <path d="M4 19V5m4 14v-6m4 6V9m4 10v-8m4 8H4" />,
    clipboard: <path d="M9 4h6l1 2h3v14H5V6h3l1-2Zm0 7h6M9 15h4" />,
    clock: <path d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    heart: <path d="M20.8 7.6a5 5 0 0 0-8.8-3 5 5 0 0 0-8.8 3c0 5.2 8.8 10.4 8.8 10.4s8.8-5.2 8.8-10.4Z" />,
    leaf: <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Zm0 0c0-5 3-8 8-8" />,
    message: <path d="M4 5h16v11H8l-4 4V5Zm4 4h8m-8 4h5" />,
    shield: <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />,
    sprout: <path d="M12 20v-8m0 0C8 12 6 9 6 5c4 0 6 3 6 7Zm0 0c4 0 6-3 6-7-4 0-6 3-6 7Z" />,
    sun: <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-4v2m0 14v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M3 12h2m14 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />,
    target: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-3a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
    users: <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1m8-11a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm8 11v-1a4 4 0 0 0-3-3.8m-2-9.9a4 4 0 0 1 0 7.4" />,
    water: <path d="M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11Z" />,
  }

  return (
    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#cce8df] text-tlali-jade-dark">
      <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        {paths[name]}
      </svg>
    </span>
  )
}
