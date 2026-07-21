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

      <style jsx>{`
        .display-step { max-width:1240px; margin:0 auto; padding-bottom:28px; }
        .display-step__heading,.display-step__section-head { display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .display-step__heading { align-items:flex-end; margin-bottom:24px; }
               h2 { margin:0; color:var(--color-text-primary); font-size:28px; letter-spacing:-.03em; }
        .display-step__heading p:last-child,.display-step__preview p { color:var(--color-text-secondary); font-size:13px; }
        .display-step__tabs,.display-step__devices { display:flex; padding:4px; border:1px solid var(--ds-border-subtle); border-radius:9px; background:var(--ds-surface-raised); }
        .display-step__tabs button,.display-step__devices button { display:inline-flex; align-items:center; gap:6px; border:0; border-radius:6px; padding:8px 11px; background:transparent; color:var(--color-text-secondary); cursor:pointer; font:inherit; font-size:12px; }
        .display-step__tabs button.is-active,.display-step__devices button.is-active { background:var(--ds-surface-selected); color:var(--color-text-primary); }
        .display-step__layout { display:grid; grid-template-columns:minmax(0,1.45fr) minmax(300px,.8fr); gap:20px; align-items:start; }
        .display-step__editor,.display-step__preview { padding:24px; }
        .display-step__sections { display:flex; flex-direction:column; gap:28px; }
        .display-step__sections section { display:flex; flex-direction:column; gap:13px; }
        .display-step__asset-row { display:grid; grid-template-columns:1.1fr .9fr; gap:14px; }
        .display-step__upload { min-height:145px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:7px; padding:10px; overflow:hidden; cursor:pointer; font:inherit; }
        .display-step__upload span,.display-step__field,.display-step__file,.display-step__template p { color:var(--color-text-muted); font-size:12px; }
        .display-step__upload strong { color:var(--color-text-primary); }
        .display-step__upload img,.display-step__image img { width:100%; height:100%; object-fit:cover; }
        .display-step__field { display:flex; flex-direction:column; gap:7px; font-weight:600; }
        .display-step__textarea { width:100%; padding:12px 14px; resize:vertical; font:inherit; line-height:1.5; }
        .display-step__details { min-height:130px; }
        .display-step__hidden { display:none; }
        .display-step__remove { align-self:flex-start; border:0; padding:3px 0; background:transparent; color:var(--ds-danger); cursor:pointer; font:inherit; font-size:12px; }
        .display-step__secondary { display:inline-flex; align-items:center; gap:6px; border:1px solid var(--ds-border-subtle); border-radius:7px; padding:8px 10px; background:var(--ds-surface-raised); color:var(--color-text-secondary); cursor:pointer; font:inherit; font-size:12px; }
        .display-step__file { margin:-7px 0 0; color:var(--ds-success-bright); }
        .display-step__badges { display:flex; flex-wrap:wrap; gap:9px; }
        .display-step__badges button { min-width:72px; padding:9px 14px; color:var(--color-text-secondary); cursor:pointer; font-size:12px; font-weight:800; }
        .display-step__channel { display:grid; grid-template-columns:24px 1fr auto; gap:12px; align-items:center; padding:14px; color:var(--ds-accent); cursor:pointer; }
        .display-step__channel strong,.display-step__channel small { display:block; }
        .display-step__channel strong { color:var(--color-text-primary); font-size:13px; }
        .display-step__channel small { margin-top:3px; color:var(--color-text-muted); font-size:11px; }
        .display-step__template { overflow:hidden; padding:0; }
        .display-step__template > div { display:flex; flex-wrap:wrap; gap:7px; padding:10px; border-bottom:1px solid var(--ds-border-subtle); }
        .display-step__template button { border:1px solid var(--ds-border-subtle); border-radius:5px; padding:4px 7px; background:var(--ds-surface-raised); color:var(--color-text-secondary); cursor:pointer; font:inherit; font-size:11px; }
        .display-step__template textarea { border:0; border-radius:0; background:transparent; }
        .display-step__template p { margin:0; padding:7px 12px; border-top:1px solid var(--ds-border-subtle); text-align:right; }
        .display-step__preview { position:sticky; top:20px; }
        .display-step__preview h3 + p { margin:5px 0 0; color:var(--color-text-muted); font-size:11px; }
        .display-step__device { margin-top:18px; overflow:hidden; border:1px solid var(--ds-border); border-radius:15px; background:var(--color-bg-app); }
        .display-step__device--mobile { width:min(100%,310px); margin-left:auto; margin-right:auto; border-width:5px; border-radius:25px; }
        .display-step__topbar { padding:12px; border-bottom:1px solid var(--ds-border-subtle); background:var(--color-bg-header); color:var(--color-betika-green); font-size:16px; font-weight:800; text-align:center; }
        .display-step__topbar span { color:var(--ds-accent); }
        .display-step__promo,.display-step__notification { margin:14px; overflow:hidden; border:1px solid var(--ds-border-subtle); border-radius:11px; background:var(--color-bg-panel); }
        .display-step__image { display:grid; height:132px; place-items:center; background:var(--ds-surface-hover); color:var(--color-text-muted); }
        .display-step__promo-body { padding:14px; }
        .display-step__preview-badges { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px; }
        .display-step__preview-badges span { border-radius:99px; padding:3px 6px; background:var(--ds-accent); color:#202020; font-size:9px; font-weight:800; }
        .display-step__promo h4 { margin:0; color:var(--color-text-primary); font-size:14px; text-transform:uppercase; }
        .display-step__promo p,.display-step__notification p { margin:7px 0 13px; color:var(--color-text-secondary); font-size:12px; line-height:1.45; }
        .display-step__promo button { border:0; border-radius:6px; padding:8px 15px; background:var(--color-betika-green); color:#fff; font:inherit; font-size:12px; font-weight:700; }
        .display-step__notification { padding:14px; }
        .display-step__notification small { color:var(--color-text-muted); font-size:10px; font-weight:800; }
        @media(max-width:920px) { .display-step__layout { grid-template-columns:1fr; } .display-step__preview { position:static; } }
        @media(max-width:620px) { .display-step__heading { align-items:flex-start; flex-direction:column; } .display-step__asset-row { grid-template-columns:1fr; } .display-step__editor,.display-step__preview { padding:18px; } .display-step__section-head { align-items:flex-start; flex-direction:column; } }
      `}</style>
    </div>
  );
}
