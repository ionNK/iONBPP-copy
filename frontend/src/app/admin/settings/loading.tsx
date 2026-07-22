'use client';

export default function SettingsLoading() {
 return (
  <div className="ds-loading-state">
   <div className="ds-loading-state__spinner" />
   <div className="ds-loading-state__content">
    <h3 className="ds-loading-state__title">Loading Settings...</h3>
   </div>
  </div>
 );
}