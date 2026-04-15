import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "../contexts/AuthContext";
import { DemoBanner } from "../components/demo-banner";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevInbox - My Dev Deck",
  description: "Email testing tool for developers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} min-h-screen flex flex-col`}>
        <AuthProvider>
          <DemoBanner />
          <div className="flex-1 min-h-0 flex flex-col">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
