import { cn } from '@/lib/utils';
import { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded border border-steel-100 bg-white px-3.5 py-2.5 text-sm text-graphite-900 placeholder:text-steel-400 focus:border-safety focus:ring-1 focus:ring-safety',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full rounded border border-steel-100 bg-white px-3.5 py-2.5 text-sm text-graphite-900 focus:border-safety focus:ring-1 focus:ring-safety',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-xs font-semibold text-steel-600 mb-1.5 tracking-wide', className)}
      {...props}
    />
  );
}
