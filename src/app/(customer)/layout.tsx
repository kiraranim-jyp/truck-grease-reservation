import { Navbar } from '@/components/customer/Navbar';
import { BottomNav } from '@/components/customer/BottomNav';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-steel-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:px-6 md:pb-12">{children}</main>
      <BottomNav />
    </div>
  );
}
