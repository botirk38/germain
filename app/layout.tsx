import type { Metadata } from "next";
import { B612, B612_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
  title: "Attache — your visa, handled",
  description:
    "Attache reviews your documents, fills in the official application, and books your embassy appointment — then keeps checking the consulate until there is a decision.",
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#a98f5f",
    colorText: "#3a4754",
    colorTextSecondary: "#6b7580",
    colorBackground: "#f5f0e8",
    colorInputBackground: "#ebe5d8",
    colorInputText: "#3a4754",
    fontFamily: "var(--font-b612), 'B612', sans-serif",
    borderRadius: "4px",
  },
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${b612.variable} ${b612Mono.variable}`}>
      <body className="font-sans text-ink">
        <ClerkProvider appearance={clerkAppearance}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
