import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prolavtex | Sistema Industrial de Despacho y Lavandería Denim",
  description:
    "Plataforma de control de despachos, procesos de lavado industrial, acabados artesanales en mezclilla y emisión de recibos A4 Original/Copia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className={`${inter.className} min-h-screen font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
