import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'outline' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--vibra-pink)',
    color: '#fff',
    border: 'none',
  },
  outline: {
    background: 'transparent',
    color: 'var(--vibra-pink)',
    border: '1px solid var(--vibra-pink)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--vibra-text)',
    border: 'none',
  },
};

export function Button({
  variant = 'primary',
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1.25rem',
        borderRadius: 'var(--vibra-radius)',
        fontWeight: 600,
        fontSize: '0.9375rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background 150ms ease, opacity 150ms ease',
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
