import { cn } from '@/utils';

type IconProps = {
  className?: string;
  /** 1 = smallest … 4 = largest */
  level?: 1 | 2 | 3 | 4;
};

const LEVEL: Record<string, 1 | 2 | 3 | 4> = {
  pequenos: 1,
  pequeno: 1,
  plana: 1,
  flaco: 1,
  medianos: 2,
  mediano: 2,
  normal: 2,
  delgado: 2,
  grandes: 3,
  grande: 3,
  nalgona: 3,
  atletico: 3,
  tetona: 4,
  muy_nalgona: 4,
  extra_grande: 4,
  musculoso: 4,
};

export function attrLevel(optionId: string): 1 | 2 | 3 | 4 {
  if (LEVEL[optionId]) return LEVEL[optionId];
  const cm = /^(\d+(?:\.\d+)?)\s*cm$/i.exec(optionId.trim());
  if (cm) {
    const n = Number(cm[1]);
    if (n < 12) return 1;
    if (n < 16) return 2;
    if (n < 19) return 3;
    return 4;
  }
  return 2;
}

/** Stylized breasts silhouette — scales with level */
export function BreastIcon({ className, level = 2 }: IconProps) {
  const r = 3.2 + level * 1.35;
  const cy = 11.5 + (4 - level) * 0.4;
  const gap = 1.1 + level * 0.15;
  return (
    <svg viewBox="0 0 24 24" className={cn('h-6 w-6', className)} aria-hidden>
      <path
        d={`M12 ${20 - level * 0.3} C ${10 - level * 0.4} ${16.5 - level * 0.2} 4 15 4 10.5 C 4 7.2 6.5 5 9.2 5.4 C 10.4 5.6 11.2 6.4 12 7.4 C 12.8 6.4 13.6 5.6 14.8 5.4 C 17.5 5 20 7.2 20 10.5 C 20 15 14 ${16.5 - level * 0.2} 12 ${20 - level * 0.3} Z`}
        fill="currentColor"
        opacity={0.18}
      />
      <circle cx={12 - r - gap / 2} cy={cy} r={r} fill="currentColor" opacity={0.92} />
      <circle cx={12 + r + gap / 2} cy={cy} r={r} fill="currentColor" opacity={0.92} />
      <circle
        cx={12 - r - gap / 2 + r * 0.15}
        cy={cy - r * 0.15}
        r={r * 0.28}
        fill="currentColor"
        opacity={0.35}
      />
      <circle
        cx={12 + r + gap / 2 + r * 0.15}
        cy={cy - r * 0.15}
        r={r * 0.28}
        fill="currentColor"
        opacity={0.35}
      />
    </svg>
  );
}

/** Stylized buttocks silhouette */
export function ButtIcon({ className, level = 2 }: IconProps) {
  const scale = 0.72 + level * 0.1;
  return (
    <svg viewBox="0 0 24 24" className={cn('h-6 w-6', className)} aria-hidden>
      <g transform={`translate(12 13) scale(${scale}) translate(-12 -13)`}>
        <path
          d="M5.5 8.5 C5.5 5.5 8 3.5 12 3.5 C16 3.5 18.5 5.5 18.5 8.5 C18.5 10.2 17.8 11.5 16.8 12.8 C18.6 14.2 19.8 16.2 19.5 18.5 C19.1 21.2 16.2 22.5 12 22.5 C7.8 22.5 4.9 21.2 4.5 18.5 C4.2 16.2 5.4 14.2 7.2 12.8 C6.2 11.5 5.5 10.2 5.5 8.5 Z"
          fill="currentColor"
          opacity={0.22}
        />
        <path
          d="M12 7.5 C9.2 7.5 7 9.6 7 12.5 C7 15.8 9 18.2 12 20.2 C15 18.2 17 15.8 17 12.5 C17 9.6 14.8 7.5 12 7.5 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity={0.35}
        />
        <ellipse cx="8.6" cy="14.2" rx={2.4 + level * 0.35} ry={3.1 + level * 0.4} fill="currentColor" />
        <ellipse cx="15.4" cy="14.2" rx={2.4 + level * 0.35} ry={3.1 + level * 0.4} fill="currentColor" />
        <path
          d="M12 10.5 V19.5"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity={0.45}
        />
      </g>
    </svg>
  );
}

/** Elegant phallus silhouette — clear small → medium → large → XL form */
export function PenisIcon({ className, level = 2 }: IconProps) {
  // Distinct silhouettes per size (viewBox 24×24, base at bottom)
  const paths: Record<1 | 2 | 3 | 4, string> = {
    // Pequeño — corto y fino
    1: `
      M 8.2 20.8
      C 8.2 18.6 9.4 17.4 11.2 17.2
      L 11.2 11.8
      C 11.2 10.2 10.9 9.2 11.15 8.35
      C 11.35 7.7 11.7 7.35 12 7.35
      C 12.3 7.35 12.65 7.7 12.85 8.35
      C 13.1 9.2 12.8 10.2 12.8 11.8
      L 12.8 17.2
      C 14.6 17.4 15.8 18.6 15.8 20.8
      C 15.8 22.2 14.4 22.8 12 22.8
      C 9.6 22.8 8.2 22.2 8.2 20.8
      Z
    `,
    // Mediano
    2: `
      M 7.2 20.6
      C 7.2 18.1 8.7 16.7 10.8 16.45
      L 10.8 9.4
      C 10.8 7.5 10.45 6.2 10.85 5.15
      C 11.15 4.35 11.55 4 12 4
      C 12.45 4 12.85 4.35 13.15 5.15
      C 13.55 6.2 13.2 7.5 13.2 9.4
      L 13.2 16.45
      C 15.3 16.7 16.8 18.1 16.8 20.6
      C 16.8 22.35 15 23.1 12 23.1
      C 9 23.1 7.2 22.35 7.2 20.6
      Z
    `,
    // Grande — más largo y grueso
    3: `
      M 6.2 20.4
      C 6.2 17.5 8.1 15.85 10.4 15.55
      L 10.4 7.2
      C 10.4 5.1 9.95 3.55 10.5 2.35
      C 10.9 1.45 11.4 1.05 12 1.05
      C 12.6 1.05 13.1 1.45 13.5 2.35
      C 14.05 3.55 13.6 5.1 13.6 7.2
      L 13.6 15.55
      C 15.9 15.85 17.8 17.5 17.8 20.4
      C 17.8 22.5 15.5 23.35 12 23.35
      C 8.5 23.35 6.2 22.5 6.2 20.4
      Z
    `,
    // Extra grande
    4: `
      M 5.4 20.2
      C 5.4 16.9 7.6 15.1 10.1 14.75
      L 10.1 5.6
      C 10.1 3.2 9.55 1.55 10.25 0.55
      C 10.7 -0.1 11.3 -0.25 12 -0.25
      C 12.7 -0.25 13.3 -0.1 13.75 0.55
      C 14.45 1.55 13.9 3.2 13.9 5.6
      L 13.9 14.75
      C 16.4 15.1 18.6 16.9 18.6 20.2
      C 18.6 22.7 15.8 23.6 12 23.6
      C 8.2 23.6 5.4 22.7 5.4 20.2
      Z
    `,
  };

  return (
    <svg viewBox="0 0 24 24" className={cn('h-6 w-6', className)} aria-hidden>
      {/* Soft glow underlay */}
      <path d={paths[level]} fill="currentColor" opacity={0.2} transform="translate(0 0.4)" />
      <path d={paths[level]} fill="currentColor" />
      {/* Glans highlight — reads as tip */}
      <ellipse
        cx="12"
        cy={level === 1 ? 8.1 : level === 2 ? 5.2 : level === 3 ? 2.6 : 1.2}
        rx={level === 1 ? 0.85 : level === 2 ? 1.05 : level === 3 ? 1.25 : 1.4}
        ry={level === 1 ? 0.7 : level === 2 ? 0.85 : level === 3 ? 1 : 1.15}
        fill="currentColor"
        opacity={0.28}
      />
      {/* Mid shaft contour for elegance */}
      <path
        d={
          level === 1
            ? 'M 11.35 11.2 C 11.55 13.5 11.55 15.5 11.45 17'
            : level === 2
              ? 'M 11.2 8.8 C 11.45 11.5 11.45 14 11.3 16.2'
              : level === 3
                ? 'M 11.05 6.5 C 11.35 10 11.35 13 11.2 15.2'
                : 'M 10.95 5 C 11.3 9 11.3 12.5 11.15 14.5'
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity={0.22}
      />
    </svg>
  );
}

export function BodyBuildIcon({ className, level = 2 }: IconProps) {
  const shoulder = 5.5 + level * 1.1;
  return (
    <svg viewBox="0 0 24 24" className={cn('h-6 w-6', className)} aria-hidden>
      <circle cx="12" cy="5.5" r="2.4" fill="currentColor" />
      <path
        d={`M12 8.2 L12 14.5 M12 9.2 L${12 - shoulder} 12.2 M12 9.2 L${12 + shoulder} 12.2 M12 14.5 L8.5 20.5 M12 14.5 L15.5 20.5`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {level >= 3 ? (
        <path
          d={`M${12 - shoulder + 1} 11.4 Q ${12 - shoulder - 0.5} 13 ${12 - shoulder + 1.2} 14.2 M${12 + shoulder - 1} 11.4 Q ${12 + shoulder + 0.5} 13 ${12 + shoulder - 1.2} 14.2`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity={0.7}
        />
      ) : null}
    </svg>
  );
}

export function SkinToneIcon({
  className,
  optionId = 'media',
}: {
  className?: string;
  optionId?: string;
}) {
  const colors: Record<string, string> = {
    clara: '#F3D5B5',
    media: '#D4A574',
    morena: '#A66B3F',
    oscura: '#5C3A21',
  };
  return (
    <svg viewBox="0 0 24 24" className={cn('h-6 w-6', className)} aria-hidden>
      <circle cx="12" cy="12" r="9" fill={colors[optionId] ?? colors.media} />
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity={0.25}
      />
    </svg>
  );
}

export function HairIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-6 w-6', className)} aria-hidden>
      <path
        d="M6 18 C6 10 8 4 12 4 C16 4 18 10 18 18"
        fill="currentColor"
        opacity={0.9}
      />
      <path
        d="M8.5 18 C8.5 12.5 9.8 7.5 12 7.5 C14.2 7.5 15.5 12.5 15.5 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity={0.35}
      />
      <path
        d="M7 14.5 C9 13 11 14 12 15.5 C13 14 15 13 17 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={0.5}
      />
    </svg>
  );
}

export type BodyAttrKind = 'breast' | 'butt' | 'penis' | 'body' | 'skin' | 'hair';

export function BodyAttrIcon({
  kind,
  optionId,
  className,
}: {
  kind: BodyAttrKind;
  optionId?: string;
  className?: string;
}) {
  const level = optionId ? attrLevel(optionId) : 2;
  if (kind === 'breast') return <BreastIcon level={level} className={className} />;
  if (kind === 'butt') return <ButtIcon level={level} className={className} />;
  if (kind === 'penis') return <PenisIcon level={level} className={className} />;
  if (kind === 'body') return <BodyBuildIcon level={level} className={className} />;
  if (kind === 'skin') return <SkinToneIcon optionId={optionId} className={className} />;
  if (kind === 'hair') return <HairIcon className={className} />;
  return null;
}

export function attrKindFromKey(key: string): BodyAttrKind | null {
  if (key === 'breastSize') return 'breast';
  if (key === 'buttType') return 'butt';
  if (key === 'penisSize' || key === 'penisGirth') return 'penis';
  if (key === 'bodyBuild' || key === 'bodyType') return 'body';
  if (key === 'skinTone') return 'skin';
  if (key === 'hair') return 'hair';
  return null;
}
