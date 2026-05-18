import { Toaster } from "@project-dailyquotes/ui/components/sonner";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Header from "@/components/header";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { ThemeProvider } from "@/components/theme-provider";

import "../index.css";

const queryClient = new QueryClient();

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "project-dailyquotes",
      },
      {
        name: "description",
        content: "project-dailyquotes is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="vite-ui-theme"
        >
          <div className="grid grid-rows-[auto_1fr] h-svh w-full overflow-x-hidden">
            <Header />
            <Outlet />
          </div>
          <Toaster
            position="bottom-right"
            expand={false}
            richColors
            toastOptions={{
              unstyled: true,
              classNames: {
                toast: [
                  "flex w-full gap-3 items-center p-4 rounded-2xl border bg-background/95 shadow-xl",
                  "backdrop-blur-sm text-foreground",
                  "border-border text-foreground",
                  "group-[.toast]:border group-[.toast]:border-border",
                  "group-[.toast]:shadow-xl",
                ].join(" "),
                success: "border-success/30 bg-success/10 text-success",
                error: "border-destructive/30 bg-destructive/10 text-destructive",
              },
            }}
          />
          <PwaInstallPrompt />
        </ThemeProvider>
      </QueryClientProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
