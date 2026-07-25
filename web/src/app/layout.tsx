import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Respawn Pricing",
  description:
    "Internal pricing and temporary quotation tool for Digital Respawn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
