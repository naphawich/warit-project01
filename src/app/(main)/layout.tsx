import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth-context";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </AuthProvider>
  );
}
