'use client';

export default function ExperimentsLoading() {
 return (
 <div className="ds-loading-state">
 <div className="ds-loading-state__spinner" />
 <div className="ds-loading-state__content">
 <h3 className="ds-loading-state__title">Loading Experiments...</h3>
 <span className="ds-loading-state__description">
 Fetching A/B test results and analytics...
 </span>
 </div>
 </div>
 );
}