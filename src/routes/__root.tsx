import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { Petals } from '@/components/layout/petals'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <TooltipProvider>
      <div className="relative flex min-h-svh flex-col overflow-x-hidden">
        <Petals />
        <SiteHeader />
        <main className="relative z-10 flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </TooltipProvider>
  )
}
