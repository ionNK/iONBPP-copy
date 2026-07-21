'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useWizardContext } from '@/context/WizardContext';
import { useTemplates } from '@/context/TemplatesContext';

import WizardStepper from '@/components/wizard/WizardStepper';
import Step1Basics from '@/components/wizard/steps/Step1Basics';
import Step2Scope from '@/components/wizard/steps/Step2Scope';
import Step3Triggers from '@/components/wizard/steps/Step3Triggers';
import Step3Test from '@/components/wizard/steps/Step3Test';
import Step4Rewards from '@/components/wizard/steps/Step4Rewards';
import Step5Schedule from '@/components/wizard/steps/Step5Schedule';
import Step6Display from '@/components/wizard/steps/Step6Display';
import Step7Review from '@/components/wizard/steps/Step7Review';
import { Save, Rocket, ChevronRight, ChevronLeft, Code, Sun, Moon, X, AlertTriangle, CheckCircle2, Eye } from 'lucide-react';
import { getMissingRequiredFields } from '@/data/promotionTemplates';


export default function CreatePromotionWizard() {
    const [currentStep, setCurrentStep] = useState(1);
  const { state, updateEligibility, loadPromotion, resetWizard, setFieldErrors, clearFieldError } = useWizardContext();

  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const templateId = searchParams.get('template');
 // A segment is only preselected for an explicit CRM handoff carrying its
 // stable id. `segmentName` is descriptive metadata, not a selection value;
 // treating it as one caused URLs such as `?segmentName=New Users` to make
 // New Users appear selected in an otherwise brand-new promotion.
 const targetSegment = searchParams.get('segment');


    const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
    const [newSegmentName, setNewSegmentName] = useState('');
  const { saveTemplate, templates } = useTemplates();
 const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
 const [newTemplateName, setNewTemplateName] = useState('');
 const [newTemplateDescription, setNewTemplateDescription] = useState('');


  const renderStep = () => {
    switch (currentStep) {
            case 1: return <Step1Basics />;
            case 2: return <Step2Scope />;
            case 3: return <Step3Triggers />;
            case 4: return <Step4Rewards />;
            case 5: return <Step5Schedule />;
            case 6: return <Step6Display />;
            case 7: return <Step7Review onEdit={setCurrentStep} />;
            default: return <Step1Basics />;
        }
    };

  // Load data if editing
  useEffect(() => {
    if (editId) {
      const saved = JSON.parse(localStorage.getItem('saved_promotions') || '[]');
      const promo = saved.find((p: any) => String(p.id) === String(editId));
      if (promo && promo.wizardState) {
        loadPromotion(promo.wizardState);
      } else if (promo) {
        // Fallback for seeds/legacy
        loadPromotion({
          ...state, // defaults
          basics: { ...state.basics, name: promo.name, type: promo.type || 'cashback' }
        });
      }
    } else if (templateId) {
      // Starting from a saved template: hydrate the wizard with its payload.
      const tpl = templates.find((t) => String(t.id) === String(templateId));
      if (tpl?.payload) {
        loadPromotion(tpl.payload);
      } else {
        resetWizard();
      }
    } else {
      resetWizard();
      // Arriving from a CRM segment "Target" action: pre-attach the audience.
      if (targetSegment) {
        updateEligibility({
          segment: targetSegment,
          customSegments: [targetSegment],
        });
      }
    }
 }, [editId, templateId, targetSegment, templates]);


    const handlePublish = async () => {
        // Prepare payload from context state
        const newPromo = {
            id: editId || Date.now(), // Keep ID if editing (string or number)
            name: state.basics.name || 'Untitled Promotion',
            type: state.basics.type,
            market: state.eligibility.markets[0]?.toUpperCase() || 'KE',
            status: 'Active',
            engagement: '0%',
            segment: state.eligibility.segment,
            stats: { claims: 0, cost: '-', conversion: '-' },
            period: `${new Date(state.schedule.startDate || Date.now()).toLocaleDateString()} - ${state.schedule.endDate ? new Date(state.schedule.endDate).toLocaleDateString() : 'Ongoing'}`,
            rules: `Min ${state.eligibility.triggers.length} Qualifications`,
            reward: `${state.rewards.type} - ${state.rewards.calcType}`,
            // New fields being sent to backend
            bannerImage: state.display.bannerImage,
            termsAndConditions: state.display.termsAndConditions,
            wizardState: state // Save full state for re-editing
        };

        try {
            // Call the Mock Backend API
            // Call the Real Backend API
            const response = await fetch('http://localhost:4000/promotions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPromo.name,
                    description: state.basics.description,
                    type: newPromo.type,
                    status: 'ACTIVE', // Default to ACTIVE
                    startDate: state.schedule.startDate,
                    endDate: state.schedule.endDate,
                    config: {
                        market: newPromo.market,
                        segment: newPromo.segment,
                        reward: state.rewards,
                        display: state.display,
                        wizardState: state // Store full state for editing
                    }
                })
            });

            if (!response.ok) {
                console.error('Failed to create promotion via API');
            }

            // Save to local storage for the prototype dashboard
            const existing = JSON.parse(localStorage.getItem('saved_promotions') || '[]');

            let updated;
            if (editId) {
                updated = existing.map((p: any) => String(p.id) === String(editId) ? newPromo : p);
            } else {
                updated = [newPromo, ...existing];
            }

            localStorage.setItem('saved_promotions', JSON.stringify(updated));

      // Navigate to dashboard
      router.push('/admin/promotions');

        } catch (err) {
            console.error('Publication error:', err);
            // Replace alert with toast in production
            console.log('Failed to publish promotion. See console for details.');
        }
    };

    const handleSaveSegment = () => {
        if (!newSegmentName.trim()) return;

        const updatedSegments = [...state.eligibility.customSegments, newSegmentName];
        updateEligibility({
            customSegments: updatedSegments,
            segment: newSegmentName
        });

        // Reset and close modal
        setNewSegmentName('');
        setIsSegmentModalOpen(false);

 // Optional: show feedback (e.g. toast) - for now just log
 console.log(`Segment "${newSegmentName}" saved successfully.`);
 };

 const handleSaveTemplate = () => {
 if (!newTemplateName.trim()) return;

 saveTemplate({
 name: newTemplateName.trim(),
 description: newTemplateDescription.trim(),
 basedOnType: state.basics.type,
 market: state.eligibility.markets[0],
 payload: state,
 });


 setNewTemplateName('');
 setNewTemplateDescription('');
 setIsTemplateModalOpen(false);

 setToast({
 show: true,
 message: `Template "${newTemplateName.trim()}" saved successfully.`,
 type: 'success',
 });
 };


    // --- Validation & Navigation ---
    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'error' | 'success' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: { // Basics — name and type are mandatory
        const errors: Record<string, string> = {};
        if (!state.basics.name || !state.basics.name.trim()) {
          errors.name = 'Please enter a promotion name.';
        }
        if (!state.basics.type) {
          errors.type = 'Please select a promotion type.';
        }
        setFieldErrors(errors);
        const count = Object.keys(errors).length;
        if (count > 0) {
          // Inline field errors are shown on the step itself, so keep the
          // top-of-page toast as a short, non-duplicative summary.
          setToast({
            show: true,
            message:
              count > 1
                ? `Please fix ${count} highlighted fields to continue.`
                : 'Please fix the highlighted field to continue.',
            type: 'error',
          });
          return false;
        }
        return true;
      }

      case 2: // Scope
        if (state.eligibility.markets.length === 0) {
          setToast({ show: true, message: 'Please select at least one target market.', type: 'error' });
          return false;
        }
        return true;
      case 4: { // Rewards — enforce the template's mandatory reward fields
        const missing = getMissingRequiredFields(state.basics.type, {
          simpleConfig: state.rewards.simpleConfig,
          wagering: state.rewards.wagering,
          freebet: {
            unitValue: state.rewards.freebet.unitValue,
            maxTotalCap: state.rewards.freebet.maxTotalCap,
            expiryHours: state.rewards.freebet.expiryHours,
          },
        });
        if (missing.length > 0) {
          setToast({
            show: true,
            message: `Please complete required reward fields: ${missing.join(', ')}.`,
            type: 'error',
          });
          return false;
        }
        return true;
      }
      // Add other steps as needed
      default:
        return true;

    }
  };


    const handleNext = () => {
        if (validateStep(currentStep)) {
            let nextStep = currentStep + 1;

            // Skip Qualification (Step 3) if a segment is selected in Scope (Step 2)
            // if (currentStep === 2 && state.eligibility.segment && state.eligibility.segment !== '') {
            //    nextStep = 4; // Jump to Rewards
            // }

            setCurrentStep(Math.min(7, nextStep));
        }
    };



return (
<div className="wizard-page">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`toast-notification ${toast.type}`}
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
        >
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast-dismiss"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}


 <div className="wizard-header">
 <div>
 <h1 className="page-title">{editId ? 'Edit Promotion' : 'Create New Promotion'}</h1>
                    <p className="page-subtitle">{editId ? 'Update promotion details and configuration.' : 'Configure qualification, rewards and display using the promotion engine.'}</p>
                </div>
                <div className="header-meta">
                    <div className="header-meta">
                        <div className="draft-badge">
                            <div className="dot"></div>
                            <span>Draft Auto-Saved</span>
                        </div>
                    </div>
                </div>
            </div>



            <Link href="/admin/promotions" className="back-to-promotions">
← Back to Promotions
</Link>

<WizardStepper currentStep={currentStep} />

            <main className="step-content-area" role="main" aria-label={`Step ${currentStep} of 7`}>
                {renderStep()}
            </main>

            {/* Segment Saving Modal (Global) */}
            {isSegmentModalOpen && (
                <div className="modal-overlay">
                    <div className="save-segment-modal">
                        <button className="close-btn-abs" onClick={() => setIsSegmentModalOpen(false)}><X size={20} /></button>

                        <div className="modal-content-center">
                            <h3>Save Segment</h3>
                            <p>Save your current Qualification Rules as a reusable player segment for future campaigns.</p>

                            <div className="form-control" style={{ textAlign: 'left' }}>
                                <label>Segment Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. High Rollers Q1"
                                    value={newSegmentName}
                                    onChange={(e) => setNewSegmentName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="modal-actions" style={{ justifyContent: 'center', width: '100%', marginTop: '24px' }}>
                                <button className="btn-cancel" onClick={() => setIsSegmentModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                                <button className="btn-primary" onClick={handleSaveSegment} disabled={!newSegmentName.trim()} style={{ flex: 2, background: 'var(--color-betika-yellow)', color: '#000', border: 'none' }}>Save Segment</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

 {/* Template Saving Modal (Global) */}
 {isTemplateModalOpen && (
 <div className="modal-overlay">
 <div className="save-segment-modal">
 <button className="close-btn-abs" onClick={() => setIsTemplateModalOpen(false)}><X size={20} /></button>

 <div className="modal-content-center">
 <h3>Save as Template</h3>
 <p>Save the current promotion configuration as a reusable template you can start new promotions from.</p>

 <div className="form-control" style={{ textAlign: 'left' }}>
 <label>Template Name</label>
 <input
 type="text"
 placeholder="e.g. Weekend Acca Boost"
 value={newTemplateName}
 onChange={(e) => setNewTemplateName(e.target.value)}
 autoFocus
 />
 </div>

 <div className="form-control" style={{ textAlign: 'left' }}>
 <label>Description (optional)</label>
 <input
 type="text"
 placeholder="Short summary of when to use this template"
 value={newTemplateDescription}
 onChange={(e) => setNewTemplateDescription(e.target.value)}
 />
 </div>

 <div className="modal-actions" style={{ justifyContent: 'center', width: '100%', marginTop: '24px' }}>
 <button className="btn-cancel" onClick={() => setIsTemplateModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
 <button className="btn-primary" onClick={handleSaveTemplate} disabled={!newTemplateName.trim()} style={{ flex: 2, background: 'var(--color-betika-yellow)', color: '#000', border: 'none' }}>Save Template</button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Sticky Footer */}
 <div className="wizard-footer">

                <div className="footer-left">
                    <button className="btn btn-secondary"><Save size={16} /> Save Draft</button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => router.push('/admin/promotions/preview')}
                        title="Preview how customers will see this promotion"
                    >
 <Eye size={16} /> Preview Customer View
 </button>
 <button
 className="btn btn-secondary"
 onClick={() => setIsTemplateModalOpen(true)}
 title="Save this configuration as a reusable template"
 >
 <Save size={16} /> Save as Template
 </button>
 {currentStep === 3 && <button className="btn btn-secondary text-accent-purple"><Code size={16} /> Compliance Scan</button>}

                </div>
                <div className="footer-right">
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            let prevStep = currentStep - 1;
                            // If going back from Rewards (Step 4) and a segment is selected, skip Qualification (Step 3)
                            if (currentStep === 4 && state.eligibility.segment && state.eligibility.segment !== '') {
                                prevStep = 2;
                            }
                            setCurrentStep(Math.max(1, prevStep));
                        }}
                        disabled={currentStep === 1}
                        style={{ opacity: currentStep === 1 ? 0.5 : 1 }}
                    >
                        <ChevronLeft size={16} /> Back
                    </button>

                    {/* NEW: Save Segment Button (Only Step 3) */}
                    {currentStep === 3 && (
                        <button
                            className="btn-save-segment"
                            onClick={() => setIsSegmentModalOpen(true)}
                            disabled={state.eligibility.triggers.length === 0}
                        >
                            <Save size={18} /> Save as Segment
                        </button>
                    )}

                    {currentStep < 7 ? (
                        <button className="btn btn-primary" onClick={handleNext}>
                            Next Step <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button className="btn btn-primary glow-effect" onClick={handlePublish}>
                            <Rocket size={16} /> {editId ? 'Save Changes' : 'Publish Promotion'}
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
                .wizard-page {
                    padding-bottom: 100px; /* Space for footer */
                }

                .step-content-area {
                    margin-top: 24px;
                }

.back-to-promotions {
display: inline-block;
margin-bottom: 20px;
color: var(--ds-success-bright) !important;
font-size: 10px;
font-weight: 400;
line-height: 14px;
text-decoration: none;
transition: color var(--ds-transition), opacity var(--ds-transition);
}

.back-to-promotions:hover {
color: var(--ds-success) !important;
}

 .back-to-promotions:focus-visible {
 outline: 2px solid var(--ds-success-bright);
 outline-offset: 4px;
 border-radius: 2px;
 }

 .wizard-header {
 display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 32px;
                }
                .page-title {
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0;
                    background: linear-gradient(90deg, var(--color-text-primary), var(--color-text-secondary));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .page-subtitle {
                    color: var(--color-text-secondary);
                    margin-top: 8px;
                }
                .draft-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: var(--color-text-muted);
                    background: var(--color-bg-input);
                    padding: 4px 12px;
                    border-radius: 20px;
                    border: 1px solid var(--color-border);
                }
                .dot { width: 6px; height: 6px; background: var(--color-betika-yellow); border-radius: 50%; box-shadow: 0 0 5px var(--color-betika-yellow); }

                /* Footer */
                .wizard-footer {
                    position: fixed;
                    bottom: 0;
                    left: var(--sidebar-width);
                    right: 0;
                    height: 80px;
                    background: var(--color-bg-panel);
                    backdrop-filter: blur(20px);
                    border-top: 1px solid var(--color-border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 40px;
                    z-index: 100;
                    box-shadow: 0 -10px 30px rgba(0,0,0,0.5);
                }
                .footer-left, .footer-right { display: flex; gap: 16px; }
                .text-betika-yellow { color: var(--color-betika-yellow); }
                
                /* Reusing Modal Styles needed here since Step 2 styles are scoped */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; }
                .event-modal { background: var(--color-bg-panel); width: 600px; border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                .modal-header { padding: 16px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: var(--color-bg-card); }
                .modal-header h3 { margin: 0; font-size: 16px; color: var(--color-text-primary); }
                .modal-header button { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; }
                .modal-body { padding: 24px; }
                .modal-desc { font-size: 13px; color: var(--color-text-muted); margin-bottom: 20px; line-height: 1.5; }
                .form-control { margin-bottom: 16px; }
                .form-control label { display: block; font-size: 12px; color: var(--color-text-muted); margin-bottom: 8px; }
                .form-control input { 
                    width: 100%; 
                    background: var(--color-bg-input); 
                    border: 1px solid var(--color-border); 
                    color: var(--color-text-primary); 
                    padding: 0 16px; 
                    border-radius: 12px; 
                    font-size: 14px; 
                    height: 48px;
                    outline: none; 
                    transition: all 0.2s;
                }
                .form-control input:focus { 
                    border-color: var(--color-betika-yellow);
                    box-shadow: 0 0 0 1px var(--color-betika-yellow);
                    background: var(--color-bg-input-focus);
                }
                .form-control input::placeholder {
                    color: var(--color-text-muted);
                }
                .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
                .btn-cancel { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-muted); padding: 8px 16px; border-radius: 6px; cursor: pointer; }

        /* Toast */
        .toast-notification {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          max-width: 90vw;
                    background: var(--color-bg-inverse, #18181b);
                    color: var(--color-text-inverse, #fff);
                    padding: 12px 24px;
                    border-radius: 50px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    z-index: 1000;
                    border: 1px solid var(--color-border);
                    animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
        .toast-notification.error { border-color: rgba(239, 68, 68, 0.5); color: #fecaca; }
        .toast-notification.success { border-color: rgba(34, 197, 94, 0.5); color: #bbf7d0; }
        .toast-dismiss {
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          opacity: 0.6;
          padding: 2px;
          margin-left: 4px;
          display: inline-flex;
          align-items: center;
          border-radius: 50%;
          transition: opacity 0.2s;
        }
        .toast-dismiss:hover { opacity: 1; }
        .toast-dismiss:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }

                
                @keyframes slideDown {
                    from { transform: translate(-50%, -20px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }

                /* Save Segment Modal - Onboarding Style */
                .save-segment-modal {
                    width: 440px;
                    background: var(--color-bg-panel);
                    border: 1px solid var(--color-border);
                    border-radius: 20px;
                    padding: 32px;
                    text-align: center;
                    position: relative;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .modal-content-center h3 { font-size: 20px; color: var(--color-text-primary); margin: 0 0 8px 0; font-weight: 700; }
                .modal-content-center p { color: var(--color-text-secondary); font-size: 14px; margin: 0 0 24px 0; line-height: 1.5; }
                
                .close-btn-abs {
                    position: absolute;
                    top: 16px; 
                    right: 16px;
                    background: transparent;
                    border: none;
                    color: #52525b;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                .close-btn-abs:hover { background: rgba(255,255,255,0.1); color: #fff; }

                /* Pill Button Style */
                .btn-save-segment {
                    background-color: var(--color-bg-input);
                    color: var(--color-text-primary);
                    border: 1px solid var(--color-border);
                    border-radius: 9999px;
                    padding: 10px 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    transition: all 0.2s;
                    font-size: 13px;
                }
                .btn-save-segment:hover {
                    background-color: var(--color-bg-input-focus);
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-sm);
                }
                .btn-save-segment:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }
                .btn-primary {
                    background-color: var(--color-betika-yellow);
                    color: #000;
                    border: none;
                    border-radius: 12px; /* Smooth rounded corners but not full pill */
                    padding: 12px 32px; /* Larger padding */
                    font-weight: 700;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                    min-width: 140px; /* Ensure wide look */
                    justify-content: center;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(234, 179, 8, 0.3);
                    filter: brightness(1.1);
                }
                .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }
            `}</style>
        </div>
    );
}
