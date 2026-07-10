import { STATUS_LABEL, type ReservationStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STYLE: Record<ReservationStatus, string> = {
  requested: 'bg-steel-100 text-steel-600',
  pending_approval: 'bg-warn-light text-warn',
  approved: 'bg-safety/10 text-safety-dark',
  visited: 'bg-blue-50 text-blue-600',
  completed: 'bg-done-light text-done',
  paid: 'bg-graphite-900 text-white',
  rejected: 'bg-red-50 text-red-600',
  cancelled: 'bg-steel-100 text-steel-500',
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-1 text-xs font-bold tracking-wide',
        STYLE[status]
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
