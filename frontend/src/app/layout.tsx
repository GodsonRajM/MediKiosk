import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { AppProvider } from "@/lib/AppContext";

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
      <body className="min-h-screen flex flex-col bg-medgrey-50 dark:bg-medgrey-900 text-medgrey-900 dark:text-medgrey-50 antialiased selection:bg-medblue-600 selection:text-white transition-colors duration-200">
        <AppProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          
          {/* Compliance & Regulatory Disclaimer Footer */}
          <footer className="w-full border-t border-medgrey-200 dark:border-medgrey-800 bg-white/80 dark:bg-medgrey-900/80 py-4 px-6 text-center text-xs text-medgrey-500">
            <div className="max-w-5xl mx-auto space-y-1">
              <p className="font-semibold text-medgrey-700 dark:text-medgrey-300">
                Smart India Hackathon 2026 • Problem Statement SIH26047 (Ministry of Ayush) • MediKiosk Clinical Intake System
              </p>
              <p className="text-[11px] text-medgrey-500">
                Designed with privacy-by-design principles and intended to align with applicable Indian data protection, ABDM consent, and healthcare security requirements. Production deployment requires formal security and compliance validation.
              </p>
            </div>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
