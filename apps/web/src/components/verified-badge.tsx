import { cn } from '@/utils';

type Props = {
  className?: string;
  label?: string;
};

/** Instagram-style verified: blue badge + white check. */
export function VerifiedBadge({ className, label = 'Verificada' }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('inline-block shrink-0', className)}
      aria-label={label}
      role="img"
    >
      <circle cx="12" cy="12" r="11" fill="#0095F6" />
      <path
        d="M7.2 12.2l3.1 3.1 6.5-6.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
