import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "세특 초안 스튜디오", description: "학생 활동 기반 세특 문구 초안" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
