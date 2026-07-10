import { RESERVATION_FLOW, STATUS_LABEL, type ReservationStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * 트럭 계기판(대시보드 게이지)에서 모티프를 가져온 예약 진행 상태 표시.
 * 바늘(needle)이 현재 단계를 가리키고, 지나온 단계는 채워진 눈금으로 표시된다.
 */
export function ReservationGauge({ status }: { status: ReservationStatus }) {
  if (status === 'rejected' || status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 rounded bg-red-50 border border-red-200 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <span className="text-sm font-semibold text-red-700">
          {STATUS_LABEL[status]}된 예약입니다
        </span>
      </div>
    );
  }

  const currentIndex = RESERVATION_FLOW.indexOf(status);

  return (
    <div className="w-full">
      <div className="relative pt-6">
        {/* 눈금 바 */}
        <div className="absolute top-9 left-0 right-0 h-1.5 bg-steel-100 rounded-full" />
        <div
          className="absolute top-9 left-0 h-1.5 bg-safety rounded-full transition-all duration-500"
          style={{
            width: `${(currentIndex / (RESERVATION_FLOW.length - 1)) * 100}%`,
          }}
        />
        <div className="relative flex justify-between">
          {RESERVATION_FLOW.map((step, i) => {
            const isDone = i < currentIndex;
            const isActive = i === currentIndex;
            return (
              <div key={step} className="flex flex-col items-center" style={{ width: 0 }}>
                {/* 바늘 */}
                {isActive && (
                  <div
                    className="absolute -top-1 h-0 w-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-graphite-900"
                    aria-hidden
                  />
                )}
                <div
                  className={cn(
                    'mt-6 h-4 w-4 rounded-full border-2 flex items-center justify-center',
                    isDone && 'bg-safety border-safety',
                    isActive && 'bg-graphite-900 border-graphite-900 ring-4 ring-safety/20',
                    !isDone && !isActive && 'bg-white border-steel-100'
                  )}
                />
                <span
                  className={cn(
                    'mt-2 whitespace-nowrap text-[11px] font-semibold tracking-tight',
                    isActive ? 'text-graphite-900' : isDone ? 'text-safety-dark' : 'text-steel-400'
                  )}
                >
                  {STATUS_LABEL[step]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
