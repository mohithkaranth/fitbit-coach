import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "fitbit-coach",
  description: "Fitbit OAuth and workout sync dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
