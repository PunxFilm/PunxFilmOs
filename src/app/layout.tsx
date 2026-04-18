import type { Metadata } from "next";
import { ToastProvider } from "@/components/toast";
import { AuthSessionProvider } from "@/components/session-provider";
import { ThemeBootstrap } from "@/components/theme-bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "PunxFilm OS",
  description: "Film Festival Distribution Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeBootstrap />
        <AuthSessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
