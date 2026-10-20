import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Analyse soumissions ST — CG",
  description: "Outil d'analyse comparative simple des soumissions sous-traitants",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="bg-slate-900 text-white px-6 py-3 flex items-center gap-4">
          <Link href="/" className="font-semibold text-lg">Analyse soumissions ST</Link>
          <span className="text-slate-400 text-sm">Construction Gauthier — Prototype v2</span>
        </header>
        <main className="max-w-6xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
