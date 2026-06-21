import type { Metadata } from "next";
import { B612, B612_Mono, Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
  title: "Attache — stop losing weeks to visa paperwork",
  description:
    "Attache is an AI visa agent that checks your documents, fills the official application, and books your embassy appointment. From upload to decision in days, not weeks.",
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
    <html lang="en" className={cn(b612.variable, b612Mono.variable, "font-sans", geist.variable)}>
      <body className="font-sans text-ink">
        <ClerkProvider appearance={clerkAppearance}>
          <TooltipProvider>{children}</TooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
