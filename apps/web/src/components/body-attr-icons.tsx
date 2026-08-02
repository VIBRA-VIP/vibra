import { useId } from 'react';
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

/** Realistic breasts — teardrop form, cleavage, clear size steps */
export function BreastIcon({ className, level = 2 }: IconProps) {
  const gid = useId().replace(/:/g, '');
  // Per-level anatomy (cx offset, radius X/Y, nipple scale, hang)
  const specs: Record<
    1 | 2 | 3 | 4,
    { rx: number; ry: number; ox: number; cy: number; nip: number; cleft: number }
  > = {
    1: { rx: 3.2, ry: 3.6, ox: 4.2, cy: 12.2, nip: 0.55, cleft: 0.8 },
    2: { rx: 4.4, ry: 5.0, ox: 5.1, cy: 12.0, nip: 0.72, cleft: 0.55 },
    3: { rx: 5.6, ry: 6.4, ox: 5.9, cy: 11.6, nip: 0.9, cleft: 0.25 },
    4: { rx: 6.8, ry: 7.6, ox: 6.6, cy: 11.2, nip: 1.05, cleft: 0 },
  };
  const s = specs[level];
  const leftCx = 12 - s.ox;
  const rightCx = 12 + s.ox;

  // Soft chest plate behind
  const plateTop = s.cy - s.ry - 1.2;
  const plateBot = s.cy + s.ry + 1.5;

  return (
    <svg viewBox="0 0 24 24" className={cn('h-6 w-6', className)} aria-hidden>
      <defs>
        <radialGradient id={`breastShine-${gid}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="55%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
        </radialGradient>
      </defs>

      {/* Upper torso hint */}
      <path
        d={`M ${4.5 + (4 - level) * 0.4} ${plateTop + 2}
            C 8 ${plateTop - 0.5} 16 ${plateTop - 0.5} ${19.5 - (4 - level) * 0.4} ${plateTop + 2}
            L ${20 - level * 0.15} ${plateBot}
            C 16 ${plateBot + 1.2} 8 ${plateBot + 1.2} ${4 + level * 0.15} ${plateBot}
            Z`}
        fill="currentColor"
        opacity={0.14}
      />

      {/* Left breast — teardrop */}
      <ellipse
        cx={leftCx}
        cy={s.cy}
        rx={s.rx}
        ry={s.ry}
        fill={`url(#breastShine-${gid})`}
      />
      {/* Right breast */}
      <ellipse
        cx={rightCx}
        cy={s.cy}
        rx={s.rx}
        ry={s.ry}
        fill={`url(#breastShine-${gid})`}
      />

      {/* Cleavage shadow */}
      <path
        d={`M 12 ${s.cy - s.ry * 0.55 + s.cleft}
            C ${12 - 0.8} ${s.cy - s.ry * 0.1} ${12 - 0.9} ${s.cy + s.ry * 0.45} 12 ${s.cy + s.ry * 0.75}
            C ${12 + 0.9} ${s.cy + s.ry * 0.45} ${12 + 0.8} ${s.cy - s.ry * 0.1} 12 ${s.cy - s.ry * 0.55 + s.cleft}
            Z`}
        fill="currentColor"
        opacity={0.28}
      />

      {/* Areola + nipple left */}
      <ellipse
        cx={leftCx + s.rx * 0.08}
        cy={s.cy + s.ry * 0.12}
        rx={s.nip * 1.55}
        ry={s.nip * 1.35}
        fill="currentColor"
        opacity={0.32}
      />
      <circle
        cx={leftCx + s.rx * 0.1}
        cy={s.cy + s.ry * 0.14}
        r={s.nip * 0.55}
        fill="currentColor"
        opacity={0.55}
      />

      {/* Areola + nipple right */}
      <ellipse
        cx={rightCx + s.rx * 0.08}
        cy={s.cy + s.ry * 0.12}
        rx={s.nip * 1.55}
        ry={s.nip * 1.35}
        fill="currentColor"
        opacity={0.32}
      />
      <circle
        cx={rightCx + s.rx * 0.1}
        cy={s.cy + s.ry * 0.14}
        r={s.nip * 0.55}
        fill="currentColor"
        opacity={0.55}
      />

      {/* Soft underside shadow for volume */}
      <ellipse
        cx={leftCx}
        cy={s.cy + s.ry * 0.55}
        rx={s.rx * 0.7}
        ry={s.ry * 0.22}
        fill="currentColor"
        opacity={0.18}
      />
      <ellipse
        cx={rightCx}
        cy={s.cy + s.ry * 0.55}
        rx={s.rx * 0.7}
        ry={s.ry * 0.22}
        fill="currentColor"
        opacity={0.18}
      />
    </svg>
  );
}

/** Realistic buttocks — round cheeks with deep cleft, size scales hard */
export function ButtIcon({ className, level = 2 }: IconProps) {
  const specs: Record<1 | 2 | 3 | 4, { rx: number; ry: number; ox: number; cy: number }> = {
    1: { rx: 3.0, ry: 3.6, ox: 3.5, cy: 13.5 },
    2: { rx: 4.0, ry: 4.8, ox: 4.2, cy: 13.2 },
    3: { rx: 5.1, ry: 6.0, ox: 5.0, cy: 12.8 },
    4: { rx: 6.2, ry: 7.2, ox: 5.7, cy: 12.4 },
  };
  const s = specs[level];

  return (
    <svg viewBox="0 0 24 24" className={cn('h-6 w-6', className)} aria-hidden>
      {/* Hip / lower back */}
      <path
        d={`M ${12 - s.ox - 1} ${s.cy - s.ry - 2.5}
            C ${12 - s.ox + 1} ${s.cy - s.ry - 4} ${12 + s.ox - 1} ${s.cy - s.ry - 4} ${12 + s.ox + 1} ${s.cy - s.ry - 2.5}
            L ${12 + s.ox + 0.5} ${s.cy - s.ry * 0.2}
            L ${12 - s.ox - 0.5} ${s.cy - s.ry * 0.2}
            Z`}
        fill="currentColor"
        opacity={0.16}
      />

      <ellipse cx={12 - s.ox} cy={s.cy} rx={s.rx} ry={s.ry} fill="currentColor" />
      <ellipse cx={12 + s.ox} cy={s.cy} rx={s.rx} ry={s.ry} fill="currentColor" />

      {/* Deep cleft */}
      <path
        d={`M 12 ${s.cy - s.ry * 0.85}
            C ${11.2} ${s.cy - s.ry * 0.2} ${11.15} ${s.cy + s.ry * 0.35} 12 ${s.cy + s.ry * 0.95}
            C ${12.85} ${s.cy + s.ry * 0.35} ${12.8} ${s.cy - s.ry * 0.2} 12 ${s.cy - s.ry * 0.85}
            Z`}
        fill="currentColor"
        opacity={0.35}
      />

      {/* Highlight on each cheek */}
      <ellipse
        cx={12 - s.ox - s.rx * 0.15}
        cy={s.cy - s.ry * 0.25}
        rx={s.rx * 0.35}
        ry={s.ry * 0.28}
        fill="currentColor"
        opacity={0.22}
      />
      <ellipse
        cx={12 + s.ox - s.rx * 0.15}
        cy={s.cy - s.ry * 0.25}
        rx={s.rx * 0.35}
        ry={s.ry * 0.28}
        fill="currentColor"
        opacity={0.22}
      />
    </svg>
  );
}

/** Realistic phallus — glans, corona, shaft, balls; dramatic length/girth */
export function PenisIcon({ className, level = 2 }: IconProps) {
  const specs: Record<
    1 | 2 | 3 | 4,
    { shaftW: number; glansR: number; ballRx: number; ballRy: number; tipY: number }
  > = {
    1: { shaftW: 2.15, glansR: 2.35, ballRx: 2.6, ballRy: 2.2, tipY: 9.2 },
    2: { shaftW: 2.7, glansR: 2.85, ballRx: 3.2, ballRy: 2.55, tipY: 6.2 },
    3: { shaftW: 3.35, glansR: 3.35, ballRx: 3.8, ballRy: 2.9, tipY: 3.4 },
    4: { shaftW: 4.0, glansR: 3.85, ballRx: 4.4, ballRy: 3.25, tipY: 1.0 },
  };
  const s = specs[level];
  const shaftTop = s.tipY + s.glansR * 0.55;
  const shaftBot = 19.0;
  const midX = 12;

  // Soft natural curve to the right for erotic silhouette
  const curve = 0.35 + level * 0.12;

  return (
    <svg viewBox="0 0 24 24" className={cn('h-6 w-6', className)} aria-hidden>
      {/* Scrotum */}
      <ellipse
        cx={midX - s.ballRx * 0.72}
        cy={20.4}
        rx={s.ballRx}
        ry={s.ballRy}
        fill="currentColor"
      />
      <ellipse
        cx={midX + s.ballRx * 0.72}
        cy={20.4}
        rx={s.ballRx}
        ry={s.ballRy}
        fill="currentColor"
      />
      <ellipse
        cx={midX}
        cy={20.15}
        rx={s.ballRx * 0.55}
        ry={s.ballRy * 0.7}
        fill="currentColor"
        opacity={0.35}
      />

      {/* Shaft — slightly curved organic path */}
      <path
        d={`
          M ${midX - s.shaftW} ${shaftBot}
          C ${midX - s.shaftW - curve * 0.3} ${(shaftBot + shaftTop) / 2}
            ${midX - s.shaftW + curve} ${shaftTop + 1}
            ${midX - s.shaftW * 0.92} ${shaftTop}
          L ${midX + s.shaftW * 0.92} ${shaftTop}
          C ${midX + s.shaftW + curve} ${shaftTop + 1}
            ${midX + s.shaftW - curve * 0.3} ${(shaftBot + shaftTop) / 2}
            ${midX + s.shaftW} ${shaftBot}
          Z
        `}
        fill="currentColor"
      />

      {/* Glans */}
      <ellipse
        cx={midX + curve * 0.4}
        cy={s.tipY}
        rx={s.glansR}
        ry={s.glansR * 0.95}
        fill="currentColor"
      />

      {/* Corona ridge */}
      <ellipse
        cx={midX + curve * 0.35}
        cy={s.tipY + s.glansR * 0.55}
        rx={s.glansR * 1.08}
        ry={s.glansR * 0.32}
        fill="currentColor"
        opacity={0.4}
      />

      {/* Urethral tip indent */}
      <ellipse
        cx={midX + curve * 0.45}
        cy={s.tipY - s.glansR * 0.35}
        rx={s.glansR * 0.22}
        ry={s.glansR * 0.32}
        fill="currentColor"
        opacity={0.3}
      />

      {/* Shaft highlight */}
      <path
        d={`
          M ${midX - s.shaftW * 0.35} ${shaftTop + 0.8}
          C ${midX - s.shaftW * 0.15} ${(shaftTop + shaftBot) / 2}
            ${midX - s.shaftW * 0.2} ${shaftBot - 2}
            ${midX - s.shaftW * 0.25} ${shaftBot - 0.5}
        `}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.9}
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
