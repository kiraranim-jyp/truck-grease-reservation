import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

const variants: Record<string, string> = {
  primary: 'bg-safety text-white hover:bg-safety-dark active:bg-safety-dark',
  secondary: 'bg-white text-graphite-900 border border-steel-100 hover:bg-steel-50',
  ghost: 'bg-transparent text-graphite-900 hover:bg-steel-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  dark: 'bg-graphite-900 text-white hover:bg-graphite-800',
};

const sizes: Record<string, string> = {
  sm: 'text-sm px-3 py-1.5 rounded-sm',
  md: 'text-sm px-4 py-2.5 rounded',
  lg: 'text-base px-6 py-3.5 rounded',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
