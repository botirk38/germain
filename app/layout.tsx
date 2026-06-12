import type { Metadata } from "next";
import { B612, B612_Mono } from "next/font/google";
import "./globals.css";

const b612 = B612({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-b612",
});

const b612Mono = B612_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-b612-mono",
});

export const metadata: Metadata = {
  title: "Attaché — your visa, handled",
  description:
    "Attaché reviews your documents, fills in the official application, and books your embassy appointment — then keeps checking the consulate until there is a decision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${b612.variable} ${b612Mono.variable}`}>
      <body className="font-sans text-ink">{children}</body>
    </html>
  );
}
