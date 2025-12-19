import "./globals.css";
import Header from "@/components/Header";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body style={{ paddingTop: "80px", background: "#faf7ff" }}>
        {/* <Toaster richColors position="bottom-center" /> */}
        <Header />
        {children}
      </body>
    </html>
  );
}
