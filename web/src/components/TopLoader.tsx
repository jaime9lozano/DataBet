import './TopLoader.css'

interface TopLoaderProps {
  active: boolean
}

export function TopLoader({ active }: TopLoaderProps) {
  return (
    <div className="top-loader" aria-hidden>
      <div className={`bar ${active ? 'bar-active' : ''}`} />
    </div>
  )
}
