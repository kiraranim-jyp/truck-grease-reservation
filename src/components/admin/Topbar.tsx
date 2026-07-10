'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

export function Topbar({ title }: { title: string }) {
  const supabase = createClient();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between border-b border-steel-100 bg-white px-4 py-4 md:px-8">
      <h1 className="font-display text-xl font-bold text-graphite-900">{title}</h1>
      <button
        onClick={logout}
        className="flex items-center gap-1.5 text-xs font-semibold text-steel-500 hover:text-graphite-900"
      >
        <LogOut size={14} /> 로그아웃
      </button>
    </div>
  );
}
