import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ReservationGauge } from '@/components/customer/ReservationGauge';
import { EventPopup } from '@/components/customer/EventPopup';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-steel-50">
      <EventPopup />
      {/* Header */}
      <header className="bg-graphite-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-safety" />
            <span className="font-display text-lg font-semibold tracking-wide">TRUCK GREASE</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-steel-400 hover:text-white">
              로그인
            </Link>
            <Link href="/reservations/new">
              <Button size="sm">지금 예약</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hazard-stripe">
        <div className="mx-auto max-w-5xl px-4 py-1 md:px-6" />
      </section>
      <section className="bg-graphite-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
          <p className="font-mono text-sm text-safety">TIME-SLOT RESERVATION</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
            화물차 그리스업,
            <br />
            <span className="text-safety">1시간 단위</span>로 예약하세요
          </h1>
          <p className="mt-5 max-w-xl text-steel-400">
            방문 대기 없이 원하는 시간에 정비소가 준비를 마칩니다.
            차량 등록부터 승인, 방문, 결제까지 한 번에 관리하세요.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/reservations/new">
              <Button size="lg">예약하러 가기</Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="secondary">
                회원가입
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reservation flow signature */}
      <section className="mx-auto max-w-5xl px-4 py-14 md:px-6">
        <p className="font-mono text-xs text-steel-500">RESERVATION GAUGE</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-graphite-900">
          예약 진행 상태를 실시간으로 확인하세요
        </h2>
        <div className="mt-8 rounded-lg border border-steel-100 bg-white p-6 md:p-10">
          <ReservationGauge status="approved" />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 pb-16 md:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<Clock className="text-safety" size={22} />}
            title="시간 단위 예약"
            desc="원하는 날짜와 시간을 선택하면 바로 승인 요청이 접수됩니다."
          />
          <FeatureCard
            icon={<ShieldCheck className="text-safety" size={22} />}
            title="관리자 승인 프로세스"
            desc="정비소 상황에 맞춰 예약을 확인하고 승인/반려할 수 있습니다."
          />
          <FeatureCard
            icon={<CheckCircle2 className="text-safety" size={22} />}
            title="SMS·카카오 알림"
            desc="예약, 승인, 방문 안내를 문자와 카카오 알림톡으로 받아보세요."
          />
        </div>
      </section>

      <footer className="border-t border-steel-100 bg-white py-8">
        <div className="mx-auto max-w-5xl px-4 text-xs text-steel-400 md:px-6">
          © Truck Grease Reservation. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-steel-100 bg-white p-6">
      <div className="mb-3">{icon}</div>
      <h3 className="font-display text-lg font-semibold text-graphite-900">{title}</h3>
      <p className="mt-1.5 text-sm text-steel-500">{desc}</p>
    </div>
  );
}
