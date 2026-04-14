export default function SectionDivider({ variant = 'hero' }) {
  if (variant === 'hero') {
    return <div className="section-divider section-divider--hero" aria-hidden="true" />;
  }

  if (variant === 'moadb') {
    return (
      <div className="section-divider section-divider--moadb" aria-hidden="true">
        <div className="divider-icon">
          <span /><span /><span /><span /><span />
        </div>
      </div>
    );
  }

  if (variant === 'som') {
    return (
      <div className="section-divider section-divider--som" aria-hidden="true">
        <div className="divider-dot" />
      </div>
    );
  }

  if (variant === 'jm') {
    return (
      <div className="section-divider section-divider--jm" aria-hidden="true">
        <div className="divider-icon">
          <div className="divider-line-short" />
          <div className="divider-diamond" />
          <div className="divider-line-short" />
        </div>
      </div>
    );
  }

  return null;
}
