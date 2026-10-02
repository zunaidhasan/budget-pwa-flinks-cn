import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

export const metadata: Metadata = {
  title: "MapleBudget | Canadian Budgeting PWA with Flinks Bank Sync",
  description: "Mobile-first Canadian budgeting PWA synchronizing Canadian financial institutions via Flinks, detecting recurring income, and tracking goals.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MapleBudget",
  },
};

export const viewport: Viewport = {
  themeColor: "#090d16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/icons/icon-192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-teal-500 selection:text-white">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
