import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scenario Simulator · Indian IT",
  description: "Explore how assumptions change plausible outcomes for Indian IT.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
