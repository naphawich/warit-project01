import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  variable: "--font-sans",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Warit Academy — เรียนคอร์สออนไลน์คุณภาพสูง",
  description:
    "แพลตฟอร์มคอร์สเรียนออนไลน์โดยผู้สอนมืออาชีพ เรียนได้ทุกที่ทุกเวลา พร้อมใบประกาศนียบัตร",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${prompt.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
