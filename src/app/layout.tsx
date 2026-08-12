import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Centro de Ayuda Manizales",
  description: "Coordinación comunitaria ante emergencias en Manizales.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
          <Link
            href="/aviso-de-privacidad"
            className="inline-flex min-h-12 items-center underline underline-offset-4"
          >
            Aviso de privacidad
          </Link>
        </footer>
      </body>
    </html>
  );
}
