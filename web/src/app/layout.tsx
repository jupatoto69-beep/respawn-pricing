import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Respawn Pricing | Digital Respawn",
  description:
    "Herramienta interna de Digital Respawn para calcular precios por área de forma clara y consistente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
