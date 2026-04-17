import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "赛道官 · CompeteAgent",
  description: "互联网+ 大学生创新创业大赛 立项 / BP / 路演 全链路 AI 助手",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
          background: "#0b1020",
          color: "#e6e8ef",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
