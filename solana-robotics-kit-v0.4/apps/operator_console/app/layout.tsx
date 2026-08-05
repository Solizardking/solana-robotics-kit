import type { ReactNode } from "react";

export const metadata = {
  title: "Solana Robotics Operator Console",
  description: "Task marketplace + $CLAWD operator UI (kit v0.4)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#09090b", color: "#fafafa", fontFamily: "system-ui" }}>
        {children}
      </body>
    </html>
  );
}
