import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CRM Notariat",
    template: "%s · CRM Notariat",
  },
  description: "Plateforme interne — événements, démos, MRR et annuaire",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen font-sans">
        {children}
        <Toaster richColors position="top-center" closeButton />
      </body>
    </html>
  );
}
