import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "MediKiosk — Pre-Consultation Patient Case-Taking (SIH26047)",
  description: "AI-assisted patient history-taking kiosk for Smart India Hackathon 2026 Ministry of Ayush track.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        
        {/* Compliance & Regulatory Disclaimer Footer */}
        <footer className="w-full border-t border-slate-800 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-400">
          <div className="max-w-5xl mx-auto space-y-1">
            <p className="font-medium text-slate-300">
              Smart India Hackathon 2026 • Problem Statement SIH26047 (Ministry of Ayush) • MediKiosk System
            </p>
            <p className="text-[11px] text-slate-400">
              Designed with privacy-by-design principles and intended to align with applicable Indian data protection, ABDM consent, and healthcare security requirements. Production deployment requires formal security and compliance validation.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
