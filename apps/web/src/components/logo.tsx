import { Link } from 'react-router-dom';
import { cn } from '@/utils';

interface LogoProps {
  className?: string;
  to?: string;
}

export function Logo({ className, to = '/' }: LogoProps) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2 no-underline', className)}>
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
        <path
          d="M16 28s-10-6.5-10-14a6 6 0 0 1 10-4.5A6 6 0 0 1 26 14c0 7.5-10 14-10 14z"
          fill="#FF1493"
        />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight text-white">Vibra</span>
    </Link>
  );
}
