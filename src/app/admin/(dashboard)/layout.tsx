import { Sidebar } from '@/components/admin/Sidebar';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-steel-50">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
