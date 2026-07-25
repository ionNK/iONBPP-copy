'use client';

export default function ReportsLoading() {
  return (
    <div className="ds-loading-state">
      <div className="ds-loading-state__spinner" />
      <div className="ds-loading-state__content">
        <h3 className="ds-loading-state__title">Generating Reports...</h3>
        <span className="ds-loading-state__description">
          Compiling campaign performance metrics...
        </span>
      </div>
    </div>
  );
}
