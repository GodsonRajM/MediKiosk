import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/AppContext";

export const metadata: Metadata = {
  title: "MediKiosk — Pre-Consultation AI Case Taking",
  description: "AI prepares the case; the doctor owns the clinical decision. Automated clinical pre-consultation and intake system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-medgrey-50 dark:bg-medgrey-900 text-medgrey-900 dark:text-medgrey-50 selection:bg-medblue-500 selection:text-white transition-colors duration-200">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
