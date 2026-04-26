import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Abrovia - AI 단기 유학 준비 도우미 | 무료 유학 준비 플랫폼",
  description: "AI 기반 무료 단기 유학 준비 플랫폼. 유학원 신뢰도 분석으로 사기 예방, AI 영어 회화 시뮬레이션, 맞춤형 체크리스트, 비용 계산기. 어학연수, 단기유학 준비의 모든 것을 한 곳에서!",
  keywords: "단기유학, 어학연수, 유학준비, 유학원추천, 유학원비교, 영어회화, AI영어, 유학비용, 유학비용계산, 영어시뮬레이션, 유학체크리스트, 유학준비물, 해외어학연수, study abroad, language school, ESL, English learning",
  authors: [{ name: "Abrovia" }],
  openGraph: {
    type: "website",
    url: "https://abrovia.vercel.app/",
    title: "Abrovia - AI 단기 유학 준비 도우미",
    description: "AI 기반 단기 유학 준비 플랫폼. 프로그램 신뢰도 분석부터 AI 회화 연습까지, 유학 준비의 모든 것.",
    siteName: "Abrovia",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Abrovia - AI 단기 유학 준비 도우미",
    description: "AI 기반 단기 유학 준비 플랫폼. 프로그램 신뢰도 분석부터 AI 회화 연습까지.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${plusJakarta.variable} antialiased`}>
        <LanguageProvider>
          <AuthProvider>
            <Layout>
              {children}
            </Layout>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
