'use client';

export default function PromotionsPredictionLoading() {
  return (
    <div className="ds-loading-state">
      <div className="ds-loading-state__spinner" />
      <div className="ds-loading-state__content">
        <h3 className="ds-loading-state__title">Preparing Forecasts</h3>
        <span className="ds-loading-state__description">
          Loading prediction models and historical data...
        </span>
      </div>
    </div>
  );
}
