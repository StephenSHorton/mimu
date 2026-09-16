import { Link } from '@tanstack/react-router'

export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-primary/15 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-baseline gap-2 no-underline">
          <span className="font-heading text-2xl tracking-tight text-primary">ミーム</span>
          <span className="text-sm text-muted-foreground">Mimu</span>
        </Link>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Text on your GIFs. Free. No paywall.
        </p>
      </div>
    </header>
  )
}
