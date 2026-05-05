export default function BrandLogo({ size = 40 }) {
  const stroke = Math.max(3, Math.round(size * 0.085));

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(10, Math.round(size * 0.26)),
        background: 'var(--brand-logo-bg)',
        border: '1px solid var(--brand-logo-border)',
        boxShadow: 'var(--brand-logo-glow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={Math.round(size * 0.82)}
        height={Math.round(size * 0.82)}
        aria-label="Auto Store Manager logo"
        role="img"
      >
        {/* Simple storefront */}
        <path d="M26 44h48v28H26z" fill="none" stroke="var(--brand-logo-fg)" strokeWidth={stroke} strokeLinejoin="round" />
        <path d="M24 44l8-12h36l8 12" fill="none" stroke="var(--brand-logo-fg)" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M26 52h48" fill="none" stroke="var(--brand-logo-fg)" strokeWidth={stroke} strokeLinecap="round" />
        <path d="M34 52v7m8-7v7m8-7v7m8-7v7m8-7v7" fill="none" stroke="var(--brand-logo-fg)" strokeWidth={Math.max(2, stroke - 1)} strokeLinecap="round" />
        <path d="M33 72V60m7 12V57m7 15V61" fill="none" stroke="var(--brand-logo-fg)" strokeWidth={Math.max(2.3, stroke - 0.8)} strokeLinecap="round" />
        <path d="M53 62h13l-2 6h-9l-2-8h-2" fill="none" stroke="var(--brand-logo-fg)" strokeWidth={Math.max(2.3, stroke - 0.8)} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="58" cy="71" r="2" fill="var(--brand-logo-fg)" />
        <circle cx="65" cy="71" r="2" fill="var(--brand-logo-fg)" />

        {/* Small gear (automation) in top-right corner */}
        <g transform="translate(74,27)">
          <circle r="8.5" fill="none" stroke="var(--brand-logo-fg)" strokeWidth={Math.max(2, stroke - 1)} />
          <circle r="3.2" fill="var(--brand-logo-fg)" />
          <path d="M0-12v3M8.5-8.5l-2.1 2.1M12 0H9M8.5 8.5l-2.1-2.1M0 12V9M-8.5 8.5l2.1-2.1M-12 0h3M-8.5-8.5l2.1 2.1"
            fill="none" stroke="var(--brand-logo-fg)" strokeWidth={Math.max(1.7, stroke - 1.3)} strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
