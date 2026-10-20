import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const prompt = Prompt({
  variable: "--font-sans",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

const title = "Warit Biology — ติวชีวะ ม.ปลาย ออนไลน์ กับครูวริศ";
const description =
  "คอร์สชีววิทยา ม.4–6 ครบทุกบท เน้นเข้าใจ ไม่ต้องท่องจำ พร้อมตะลุยโจทย์ A-Level กับครูวริศ ฤทธิ์มานะ";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  // Link previews in LINE / Facebook / X.
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: SITE_NAME,
    title,
    description,
    images: [{ url: "/hero-warit.jpg", alt: "ครูวริศ ฤทธิ์มานะ ติวเตอร์ชีววิทยา ม.ปลาย" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/hero-warit.jpg"],
  },
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
