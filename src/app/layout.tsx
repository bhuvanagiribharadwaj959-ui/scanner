import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VS Code Web - GitHub Code Viewer (Monaco Editor)",
  description:
    "Interactive read-only VS Code web environment using Monaco Editor, GitHub tree structure ingestion, Explorer, Search, and Git History.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💻</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
