import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game On",
  description: "Create a group, suggest a sport, split the cost.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans">
        <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
