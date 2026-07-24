'use client';

import { useRef, useState } from 'react';
import { Bell, Eye, FileText, Globe, Image as ImageIcon, MessageSquare, Smartphone, UploadCloud } from 'lucide-react';
import { useWizardContext } from '@/context/WizardContext';

const BADGES = ['NEW', 'HOT', 'LIMITED', 'VIP'];

export default function StepDisplay() {
  const { state, updateDisplay } = useWizardContext();
  const { activeTab, title, teaser, badges, communication, bannerImage, termsAndConditions, fullContent, fullContentFile } = state.display;
  const [device, setDevice] = useState<'web' | 'mobile'>('web');
  const bannerInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);

  const setCommunication = (data: Partial<typeof communication>) =>
    updateDisplay({ communication: { ...communication, ...data } });

  const uploadBanner = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateDisplay({ bannerImage: reader.result as string });
    reader.readAsDataURL(file);
  };

  const uploadDocument = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (/\.(pdf|doc|docx)$/i.test(file.name)) {
      updateDisplay({
        fullContentFile: file.name,
        fullContent: `[${file.name} attached]\n\nPaste the document content here to include it in the preview.`,
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateDisplay({ fullContentFile: file.name, fullContent: String(reader.result || '') });
    reader.readAsText(file);
  };

  const toggleBadge = (badge: string) =>
    updateDisplay({ badges: badges.includes(badge) ? badges.filter((item) => item !== badge) : [...badges, badge] });

  const previewSms = communication.smsTemplate
    .replace('{{amount}}', '100')
    .replace('{{week}}', 'Week 1')
    .replace('{{player_name}}', 'John');

  return (
    <div className="display-step">
      <header className="display-step__heading">
        <div>
                   <h2>Display &amp; communication</h2>
          <p>Configure the customer-facing offer and delivery messages.</p>
        </div>
        <div className="display-step__tabs" role="tablist" aria-label="Display configuration">
          <button className={activeTab === 'display' ? 'is-active' : ''} type="button" role="tab" aria-selected={activeTab === 'display'} onClick={() => updateDisplay({ activeTab: 'display' })}>
            <ImageIcon size={15} /> Offer display
          </button>
          <button className={activeTab === 'communication' ? 'is-active' : ''} type="button" role="tab" aria-selected={activeTab === 'communication'} onClick={() => updateDisplay({ activeTab: 'communication' })}>
            <MessageSquare size={15} /> Communication
          </button>
        </div>
      </header>

      <div className="display-step__layout">
        <main className="ds-panel display-step__editor">
          {activeTab === 'display' ? (
            <div className="display-step__sections">
              <section>
                <h3 className="ds-section-label"><ImageIcon size={17} /> Visual asset</h3>
                <div className="display-step__asset-row">
                  <button className={`ds-add-action display-step__upload ${bannerImage ? 'has-image' : ''}`} type="button" onClick={() => bannerInput.current?.click()}>
                    {bannerImage ? <img src={bannerImage} alt="Selected promotion banner" /> : <><UploadCloud size={27} /><strong>Upload hero image</strong><span>Recommended: 1920 × 600</span></>}
                  </button>
                  <label className="display-step__field">Banner image URL
                    <input className="ds-control" type="url" value={bannerImage.startsWith('data:') ? '' : bannerImage} placeholder="https://example.com/banner.jpg" onChange={(event) => updateDisplay({ bannerImage: event.target.value })} />
                    {bannerImage && <button className="display-step__remove" type="button" onClick={() => updateDisplay({ bannerImage: '' })}>Remove image</button>}
                  </label>
                </div>
                <input ref={bannerInput} className="display-step__hidden" type="file" accept="image/*" onChange={uploadBanner} />
              </section>

              <section>
                <h3 className="ds-section-label"><FileText size={17} /> Public content</h3>
                <label className="display-step__field">Display title
                  <input className="ds-control" value={title} placeholder="e.g. Weekend odds boost" onChange={(event) => updateDisplay({ title: event.target.value })} />
                </label>
                <label className="display-step__field">Short teaser
                  <textarea className="ds-control display-step__textarea" rows={3} value={teaser} placeholder="A concise promotion description." onChange={(event) => updateDisplay({ teaser: event.target.value })} />
                </label>
              </section>

              <section>
                <div className="display-step__section-head">
                  <h3 className="ds-section-label"><FileText size={17} /> Offer details</h3>
                  <button className="display-step__secondary" type="button" onClick={() => documentInput.current?.click()}><UploadCloud size={14} /> {fullContentFile ? 'Replace document' : 'Upload document'}</button>
                </div>
                {fullContentFile && <p className="display-step__file">Attached: {fullContentFile}</p>}
                <textarea className="ds-control display-step__textarea display-step__details" rows={7} value={fullContent || ''} placeholder="Add the full promotion description." onChange={(event) => updateDisplay({ fullContent: event.target.value })} />
                <input ref={documentInput} className="display-step__hidden" type="file" accept=".txt,.html,.md,.pdf,.doc,.docx" onChange={uploadDocument} />
              </section>

              <section>
                <h3 className="ds-section-label"><FileText size={17} /> Terms &amp; conditions</h3>
                <textarea className="ds-control display-step__textarea display-step__details" rows={5} value={termsAndConditions} placeholder="Enter the terms and conditions." onChange={(event) => updateDisplay({ termsAndConditions: event.target.value })} />
              </section>

              <section>
                <h3 className="ds-section-label">Promotion badges</h3>
                <div className="display-step__badges">
                  {BADGES.map((badge) => <button className={`ds-choice ${badges.includes(badge) ? 'is-selected' : ''}`} key={badge} type="button" aria-pressed={badges.includes(badge)} onClick={() => toggleBadge(badge)}>{badge}</button>)}
                </div>
              </section>
            </div>
          ) : (
            <div className="display-step__sections">
              <section>
                <h3 className="ds-section-label"><MessageSquare size={17} /> Delivery channels</h3>
                <label className={`ds-choice display-step__channel ${communication.smsEnabled ? 'is-selected' : ''}`}>
                  <MessageSquare size={19} /><span><strong>SMS</strong><small>Send an immediate text message</small></span>
                  <span className="ds-switch"><input type="checkbox" checked={communication.smsEnabled} onChange={(event) => setCommunication({ smsEnabled: event.target.checked })} aria-label="Enable SMS" /><span className="ds-switch__track" /></span>
                </label>
                <label className={`ds-choice display-step__channel ${communication.pushEnabled ? 'is-selected' : ''}`}>
                  <Bell size={19} /><span><strong>Push notification</strong><small>Send an app and web alert</small></span>
                  <span className="ds-switch"><input type="checkbox" checked={communication.pushEnabled} onChange={(event) => setCommunication({ pushEnabled: event.target.checked })} aria-label="Enable push notifications" /><span className="ds-switch__track" /></span>
                </label>
              </section>
              {communication.smsEnabled && <section>
                <h3 className="ds-section-label"><MessageSquare size={17} /> SMS template</h3>
                <div className="ds-card display-step__template">
                  <div>{[['Amount', '{{amount}}'], ['Week', '{{week}}'], ['Player', '{{player_name}}']].map(([label, variable]) => <button key={variable} type="button" onClick={() => setCommunication({ smsTemplate: `${communication.smsTemplate} ${variable}` })}>{label}</button>)}</div>
                  <textarea className="ds-control display-step__textarea" rows={5} value={communication.smsTemplate} placeholder="Write your SMS message." onChange={(event) => setCommunication({ smsTemplate: event.target.value })} />
                  <p>{communication.smsTemplate.length} characters</p>
                </div>
              </section>}
            </div>
          )}
        </main>

        <aside className="ds-panel display-step__preview">
          <div className="display-step__section-head">
            <div><h3 className="ds-section-label"><Eye size={17} /> Live preview</h3><p>Player-facing appearance</p></div>
            <div className="display-step__devices" role="tablist">
              <button type="button" className={device === 'web' ? 'is-active' : ''} onClick={() => setDevice('web')}><Globe size={14} /> Web</button>
              <button type="button" className={device === 'mobile' ? 'is-active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={14} /> Mobile</button>
            </div>
          </div>
          <div className={`display-step__device display-step__device--${device}`}>
            <div className="display-step__topbar">Betika<span>!</span></div>
            {activeTab === 'display' ? <article className="display-step__promo">
              <div className="display-step__image">{bannerImage ? <img src={bannerImage} alt="Promotion banner preview" /> : <ImageIcon size={34} />}</div>
              <div className="display-step__promo-body">
                {badges.length > 0 && <div className="display-step__preview-badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div>}
                <h4>{title || 'Promotion title'}</h4>
                <p>{teaser || 'A short description of this promotion will appear here.'}</p>
                <button type="button">Bet now</button>
              </div>
            </article> : <div className="display-step__notification"><small>MESSAGES · NOW</small><p>{previewSms || 'Your SMS message preview will appear here.'}</p></div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
