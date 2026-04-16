import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PitWall — F1 Statistics",
  description: "Formula 1 historical statistics from 2010 to 2024",
};

const navLinks = [
  { href: "/drivers", label: "Drivers" },
  { href: "/races", label: "Races" },
  { href: "/standings", label: "Standings" },
  { href: "/constructors", label: "Constructors" },
  { href: "/circuits", label: "Circuits" },
  { href: "/compare", label: "Compare" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-f1-red font-bold text-xl tracking-tight">
                PitWall
              </Link>
              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href="/admin"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          </div>
        </nav>

        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          {children}
        </main>

        <footer className="border-t border-border py-6 text-center text-sm text-muted">
          Data sourced from Kaggle F1 World Championship Dataset &middot; 2010&ndash;2024
        </footer>
      </body>
    </html>
  );
}
