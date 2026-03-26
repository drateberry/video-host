import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video Host",
  description: "Personalized video outreach platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
