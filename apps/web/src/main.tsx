import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { PwaUpdater } from "@/components/pwa-updater"
import { AppBoot } from "@/components/startup/app-boot"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { bootApp } from "@/lib/boot"
import { routeTree } from "./routeTree.gen"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: Number.POSITIVE_INFINITY },
    mutations: { retry: false },
  },
})

const boot = () => bootApp(queryClient)

const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error("Élément #root introuvable")

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppBoot boot={boot}>
            <RouterProvider router={router} />
            <PwaUpdater />
          </AppBoot>
          <Toaster
            position="bottom-center"
            offset={{ bottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
            mobileOffset={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
          />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
