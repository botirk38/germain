import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Germain — Your AI visa case agent",
  description:
    "Upload your documents. Choose your visa. Germain prepares the case, fills the forms, tracks follow-ups, and keeps you in control.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#0d0d0d] text-[#f5f5f5]">{children}</body>
    </html>
  );
}
