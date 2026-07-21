'use client';
import { useBetSlip } from '@/context/BetSlipContext';
import { getAvailableCombinations, CombinationType } from '@/utils/combinatorics';
import { X, CheckCircle, Trash2, Wallet, ChevronDown, AlertCircle, RefreshCw, HandCoins, Info, Zap } from 'lucide-react';
import { useState } from 'react';

export default function BetSlipWidget() {
  const { 
    selections, stakes, updateStake, oddsFormat, clearSlip, removeSelection,
    isSlipOpen, setSlipOpen, selectedFundingId, setSelectedFundingId,
    isFundingRestricted, getActiveFunding, getAvailableFundingSources,
    activeTab, setActiveTab, openBets, settledBets, cashOutBet,
    getKRAFinancials, placeBet
  } = useBetSlip();
  
  const [flowState, setFlowState] = useState<'build' | 'confirm' | 'loading' | 'success'>('build');
  const [isFundingMenuOpen, setIsFundingMenuOpen] = useState(false);

  if (!isSlipOpen && selections.length === 0 && openBets.length === 0) return null;

  const activeFunding = getActiveFunding();
  const financials = getKRAFinancials();
  const fundingSources = getAvailableFundingSources();
  
  const activeCombs = getAvailableCombinations(selections.length);

  const addQuickStake = (type: CombinationType, amt: number) => {
      const cur = stakes[type] || 0;
      updateStake(type, cur + amt);
  };

  const handleConfirmAndPlace = () => {
      setFlowState('loading');
      setTimeout(() => {
          placeBet();
          setFlowState('success');
      }, 1500);
  };

  const formatKES = (val: number) => {
    return 'KES ' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className={`betslip-widget ${isSlipOpen ? 'open' : ''}`}>
      <div className="betslip-header">
         <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Bet Slip</h3>
         <button className="icon-btn-ghost" onClick={() => setSlipOpen(false)}>
            <X size={20} />
         </button>
      </div>
      
      <div className="betslip-tabs">
          <button className={activeTab === 'betslip' ? 'active' : ''} onClick={() => setActiveTab('betslip')}>
             Bet Slip {selections.length > 0 && <span className="badge">{selections.length}</span>}
          </button>
          <button className={activeTab === 'mybets' ? 'active' : ''} onClick={() => setActiveTab('mybets')}>
             My Bets {openBets.length > 0 && <span className="badge">{openBets.length}</span>}
          </button>
          <button className={activeTab === 'settled' ? 'active' : ''} onClick={() => setActiveTab('settled')}>
             Settled
          </button>
      </div>

      <div className="betslip-body">
         {activeTab === 'settled' && (
             <div className="tab-pane">
                 {settledBets.length === 0 ? (
                     <div className="empty-state">No settled bets history.</div>
                 ) : (
                     <div className="history-list">
                         {settledBets.map(bet => (
                             <div key={bet.id} className="history-card">
                                 <div className="hist-head">
                                     <span style={{ fontWeight: 800 }}>{bet.combiDescs.join(', ')}</span>
                                     <span className={`status-badge ${bet.status}`}>{bet.status.toUpperCase()}</span>
                                 </div>
                                 <div className="hist-metrics">
                                     <div>
                                         <span>Stake</span>
                                         <strong>{formatKES(bet.totalStake)}</strong>
                                     </div>
                                     <div>
                                         <span>Net Payout</span>
                                         <strong style={{ color: bet.breakdown.netPayout > bet.totalStake ? 'var(--color-betika-green)' : '#fff' }}>{formatKES(bet.breakdown.netPayout)}</strong>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
         )}

         {activeTab === 'mybets' && (
             <div className="tab-pane">
                 {openBets.length === 0 ? (
                     <div className="empty-state">You have no open wagers.</div>
                 ) : (
                     <div className="history-list">
                         {openBets.map(bet => (
                             <div key={bet.id} className="history-card open-card">
                                 <div className="hist-head">
                                     <span style={{ fontWeight: 800, color: '#fff' }}>{bet.combiDescs.join(' + ')}</span>
                                     <span style={{ fontSize: '11px', color: 'var(--color-betika-yellow)' }}>OPEN</span>
                                 </div>
                                 <div className="hist-metrics">
                                     <div>
                                         <span>Total Stake</span>
                                         <strong>{formatKES(bet.totalStake)}</strong>
                                     </div>
                                     <div style={{ textAlign: 'right' }}>
                                         <span>Est. Payout</span>
                                         <strong style={{ color: 'var(--color-betika-green)' }}>{formatKES(bet.breakdown.netPayout)}</strong>
                                     </div>
                                 </div>
                                 <button className="btn-cashout" onClick={() => cashOutBet(bet.id)}>
                                     <HandCoins size={16} /> Cash Out {formatKES(bet.cashOutValue || 0)}
                                 </button>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
         )}

         {activeTab === 'betslip' && (
             flowState === 'success' ? (
                 <div className="success-pane">
                     <CheckCircle size={56} color="var(--color-betika-green)" style={{ marginBottom: '16px' }} />
                     <h2>Bet Placed</h2>
                     <p style={{ margin: '0 0 24px 0', color: 'var(--color-text-secondary)' }}>Good luck! Check My Bets for updates.</p>
                     
                     <div className="receipt kra-breakdown">
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                             <h3 style={{ margin: 0 }}>Receipt</h3>
                             <div className="points-earned-tag">+{financials.pointsEarned} Pts</div>
                         </div>
                         <div className="rr"><span>Gross Stake</span><strong>{formatKES(financials.grossStake)}</strong></div>
                         <div className="rr"><span>Excise Duty (7.5%)</span><strong style={{ color: '#ef4444' }}>-{formatKES(financials.exciseDuty)}</strong></div>
                         <div className="rr net-stake"><span>Actual Net Stake</span><strong>{formatKES(financials.netStake)}</strong></div>
                         <hr style={{ borderColor: 'var(--color-border)', margin: '12px 0' }} />
                         <div className="rr"><span>Withholding Tax (20%)</span><strong style={{ color: '#ef4444' }}>-{formatKES(financials.whtDeduction)}</strong></div>
                         <div className="rr final">
                             <span style={{ color: '#fff' }}>Net Potential Payout</span>
                             <strong style={{ color: 'var(--color-betika-green)' }}>{formatKES(financials.netPayout)}</strong>
                         </div>
                     </div>
                     <button className="btn-solid" onClick={() => { setFlowState('build'); setActiveTab('mybets'); }}>Go to My Bets</button>
                 </div>
             ) : flowState === 'loading' ? (
                 <div className="empty-state" style={{ height: '400px' }}>
                     <RefreshCw size={32} className="spin-anim" style={{ marginBottom: '16px', color: 'var(--color-betika-yellow)' }} />
                     <h3>Processing Bet...</h3>
                     <p>Finalizing KRA tax calculations.</p>
                 </div>
             ) : flowState === 'confirm' ? (
                 <div className="confirm-pane">
                     <div style={{ padding: '20px' }}>
                        <h3>Placement Summary</h3>
                        <div className="receipt kra-breakdown">
                            <div className="rr"><span>Total Gross Stake</span><strong>{formatKES(financials.grossStake)}</strong></div>
                            <div className="rr"><span>KRA Excise Duty</span><strong style={{ color: '#ef4444' }}>-{formatKES(financials.exciseDuty)}</strong></div>
                            <div className="rr"><span>Net Invested Stake</span><strong>{formatKES(financials.netStake)}</strong></div>
                            <hr style={{ borderColor: 'var(--color-border)', margin: '12px 0' }} />
                            <div className="rr"><span>Gross Potential Return</span><strong>{formatKES(financials.grossReturn)}</strong></div>
                            <div className="rr"><span>WHT (20% on winnings)</span><strong style={{ color: '#ef4444' }}>-{formatKES(financials.whtDeduction)}</strong></div>
                            <div className="rr final">
                                <span style={{ color: '#fff' }}>Net Expected Hit</span>
                                <strong style={{ color: 'var(--color-betika-green)' }}>{formatKES(financials.netPayout)}</strong>
                            </div>
                        </div>
                        <div className="points-nudge-confirm">
                            <Zap size={14} fill="var(--color-betika-yellow)" />
                            <span>You will earn <strong>{financials.pointsEarned}</strong> Reward Points from this bet!</span>
                        </div>
                        <div className="actions" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setFlowState('build')}>Cancel</button>
                            <button className="btn-solid" style={{ flex: 2 }} onClick={handleConfirmAndPlace}>Place Bet Now</button>
                        </div>
                     </div>
                 </div>
             ) : selections.length === 0 ? (
                 <div className="empty-state">
                     <div style={{ textAlign: 'center' }}>
                        <Wallet size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                        <p>Your bet slip is empty.</p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Add selections to start wagering.</p>
                     </div>
                 </div>
             ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                     <div className="selections-list">
                         <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                             <button className="btn-clear-all" onClick={clearSlip}><Trash2 size={12}/> Clear All Selections</button>
                         </div>
                         {selections.map(sel => (
                             <div key={sel.id} className="selection-card">
                                 <div className="sel-head">
                                     <span className="sel-market">{sel.marketName}</span>
                                     <button className="del-btn" onClick={() => removeSelection(sel.id)}><X size={14}/></button>
                                 </div>
                                 <div className="sel-body">
                                     <span className="sel-name">{sel.selectionName}</span>
                                     <div className="sel-odds-group">
                                        <span className="sel-odds">{sel.oddsDec.toFixed(2)}</span>
                                     </div>
                                 </div>
                                 <p className="sel-match">{sel.matchName}</p>
                             </div>
                         ))}
                     </div>
                     
                     <div className="combinatorics-panel">
                        {activeCombs.map(comb => (
                            <div key={comb.type} className="comb-row">
                                <div className="comb-label">
                                    <strong style={{ color: '#fff', fontSize: '14px' }}>{comb.label}</strong>
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>{comb.lines} Bets</span>
                                </div>
                                <div className="comb-input-zone">
                                    <div className="ci-box">
                                        <span>KES</span>
                                        <input 
                                            type="number" 
                                            placeholder="0.00"
                                            value={stakes[comb.type] || ''}
                                            onChange={e => updateStake(comb.type, Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="q-stakes">
                                        <button onClick={() => addQuickStake(comb.type, 100)}>+100</button>
                                        <button onClick={() => addQuickStake(comb.type, 500)}>+500</button>
                                        <button onClick={() => addQuickStake(comb.type, 1000)}>+1K</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>

                     <div className="betslip-footer">
                         <div className="kra-breakdown-mini">
                            <div className="sg-row"><span>Gross Stake</span><strong>{formatKES(financials.grossStake)}</strong></div>
                            <div className="sg-row"><span>Excise (7.5%)</span><strong style={{ color: '#ef4444' }}>-{formatKES(financials.exciseDuty)}</strong></div>
                            <div className="sg-row"><span>Net Stake</span><strong>{formatKES(financials.netStake)}</strong></div>
                            
                            <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
                            
                            <div className="sg-row">
                                <span>Potential Payout</span>
                                {activeFunding.type === 'odds_boost' ? (
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '10px', textDecoration: 'line-through', opacity: 0.5 }}>{formatKES(financials.netPayout / activeFunding.boostMultiplier!)}</div>
                                        <strong style={{ color: 'var(--color-betika-yellow)' }}>{formatKES(financials.netPayout)}</strong>
                                    </div>
                                ) : (
                                    <strong style={{ color: 'var(--color-betika-green)' }}>{formatKES(financials.netPayout)}</strong>
                                )}
                            </div>
                            
                            <div className="potential-points-earned">
                                <span>Reward Pts Earned:</span>
                                <strong>+{financials.pointsEarned}</strong>
                            </div>
                         </div>
                         
                         <div className="funding-selector-footer" style={{ marginTop: '16px' }}>
                             <button className="funding-selector-btn" onClick={() => setIsFundingMenuOpen(!isFundingMenuOpen)}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                     {activeFunding.type === 'odds_boost' ? <Zap size={16} color="var(--color-betika-yellow)"/> : <Wallet size={16} />}
                                     <span style={{ fontWeight: 700 }}>{activeFunding.name}</span>
                                 </div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                     <span style={{ color: 'var(--color-betika-yellow)', fontWeight: 700 }}>{activeFunding.type === 'odds_boost' ? 'ACTIVE' : formatKES(activeFunding.balance)}</span>
                                     <ChevronDown size={14} />
                                 </div>
                             </button>

                             {isFundingMenuOpen && (
                                 <div className="funding-dropdown">
                                    {fundingSources.map(source => {
                                        const { restricted, reason } = isFundingRestricted(source);
                                        return (
                                           <button 
                                              key={source.id}
                                              className={`funding-option ${restricted ? 'disabled' : ''} ${selectedFundingId === source.id ? 'selected' : ''}`}
                                              onClick={() => {
                                                 if (!restricted) {
                                                    setSelectedFundingId(source.id);
                                                    setIsFundingMenuOpen(false);
                                                 }
                                              }}
                                           >
                                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {source.type === 'odds_boost' && <Zap size={14} color="var(--color-betika-yellow)"/>}
                                                    <strong>{source.name}</strong>
                                                 </div>
                                                 <span>{source.type === 'odds_boost' ? 'Boost Applier' : formatKES(source.balance)}</span>
                                              </div>
                                              {source.description && <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.6 }}>{source.description}</p>}
                                              {restricted && <p className="err-note"><AlertCircle size={10}/> {reason}</p>}
                                           </button>
                                        )
                                    })}
                                 </div>
                             )}
                         </div>

                         <button 
                             className="btn-place-action" 
                             disabled={financials.grossStake <= 0}
                             onClick={() => setFlowState('confirm')}
                             style={{ marginTop: '16px' }}
                         >
                            Review & Place Bet
                         </button>
                     </div>
                 </div>
             )
         )}
      </div>

      <style jsx>{`
        .betslip-widget {
          position: fixed; bottom: 0; right: 40px; width: 440px; height: 90vh;
          background: var(--color-bg-panel); border: 1px solid var(--color-border);
          border-radius: 16px 16px 0 0; box-shadow: 0 -10px 40px rgba(0,0,0,0.6);
          display: flex; flex-direction: column; z-index: 1000; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transform: translateY(100%); overflow: hidden;
        }
        .betslip-widget.open { transform: translateY(0); }
        .betslip-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .betslip-tabs { display: flex; background: var(--color-bg-app); border-bottom: 1px solid var(--color-border); }
        .betslip-tabs button { flex: 1; padding: 14px; background: transparent; border: none; color: var(--color-text-secondary); cursor: pointer; font-weight: 800; border-bottom: 3px solid transparent; transition: 0.2s; font-size: 13px; }
        .betslip-tabs button.active { color: var(--color-betika-yellow); border-bottom-color: var(--color-betika-yellow); }
        .badge { background: var(--color-betika-yellow); color: #000; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 6px; }

        .betslip-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .tab-pane { padding: 16px; }
        .empty-state { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); }

        .history-card { background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 12px; padding: 16px; margin-bottom: 12px; }
        .hist-metrics { display: flex; justify-content: space-between; margin-top: 12px; }
        .hist-metrics span { font-size: 11px; color: var(--color-text-muted); display: block; }

        .selections-list { padding: 16px; flex: 1; }
        .selection-card { background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 12px; padding: 16px; margin-bottom: 12px; position: relative; }
        .sel-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .sel-market { font-size: 10px; color: var(--color-text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .del-btn { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; }
        .sel-body { display: flex; justify-content: space-between; font-weight: 800; color: #fff; font-size: 15px; }
        .sel-match { font-size: 12px; color: var(--color-text-muted); margin: 6px 0 0 0; }
        .sel-odds { color: var(--color-betika-yellow); background: rgba(242, 214, 65, 0.1); padding: 2px 8px; border-radius: 4px; }

        .combinatorics-panel { padding: 16px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); }
        .comb-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .ci-box { background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 8px; padding: 10px 14px; display: flex; gap: 8px; width: 140px; }
        .ci-box span { font-size: 12px; color: var(--color-text-muted); font-weight: 700; }
        .ci-box input { background: transparent; border: none; color: #fff; width: 100%; outline: none; font-weight: 800; font-size: 14px; }
        .q-stakes { display: flex; gap: 4px; margin-top: 8px; }
        .q-stakes button { font-size: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--color-border); color: #fff; padding: 5px 8px; border-radius: 6px; cursor: pointer; font-weight: 700; }

        .betslip-footer { padding: 20px; border-top: 1px solid var(--color-border); background: var(--color-bg-app); }
        .sg-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--color-text-muted); margin-bottom: 6px; }
        
        .potential-points-earned { margin-top: 12px; background: rgba(242, 214, 65, 0.05); padding: 8px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(242, 214, 65, 0.1); }
        .potential-points-earned span { font-size: 11px; font-weight: 700; color: var(--color-text-secondary); }
        .potential-points-earned strong { color: var(--color-betika-yellow); font-size: 13px; font-weight: 900; }

        .kra-breakdown-mini { display: flex; flex-direction: column; gap: 2px; }

        .funding-selector-btn { width: 100%; padding: 14px; background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 10px; color: #fff; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .funding-dropdown { position: absolute; bottom: 85px; left: 20px; right: 20px; background: var(--color-bg-panel); border: 1px solid var(--color-border); border-radius: 12px; padding: 12px; z-index: 100; box-shadow: 0 -10px 40px rgba(0,0,0,0.8); }
        .funding-option { width: 100%; padding: 14px; border-radius: 8px; background: var(--color-bg-app); color: #fff; text-align: left; margin-bottom: 8px; border: 1px solid transparent; cursor: pointer; }
        .funding-option:last-child { margin-bottom: 0; }
        .funding-option.selected { border-color: var(--color-betika-yellow); background: rgba(242, 214, 65, 0.05); }
        .funding-option.disabled { opacity: 0.5; cursor: not-allowed; }
        .err-note { font-size: 11px; color: #ef4444; margin-top: 6px; font-weight: 700; }

        .btn-place-action { width: 100%; background: var(--color-betika-green); color: #fff; border: none; padding: 18px; border-radius: 12px; font-weight: 900; font-size: 16px; cursor: pointer; transition: 0.2s; }
        .btn-place-action:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 4px 20px rgba(105, 153, 81, 0.4); }
        .btn-place-action:disabled { opacity: 0.5; filter: grayscale(1); }

        .success-pane { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; text-align: center; }
        .points-earned-tag { background: var(--color-betika-yellow); color: #000; padding: 4px 10px; border-radius: 6px; font-weight: 900; font-size: 12px; }
        
        .confirm-pane { display: flex; flex-direction: column; height: 100%; }
        .receipt { width: 100%; background: #000; border: 1px solid var(--color-border); border-radius: 16px; padding: 24px; text-align: left; }
        .rr { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: var(--color-text-secondary); }
        .rr.final { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; margin-top: 5px; font-size: 20px; font-weight: 900; }
        
        .points-nudge-confirm { display: flex; align-items: center; gap: 8px; padding: 12px; background: rgba(242, 214, 65, 0.1); border-radius: 8px; margin-top: 16px; border: 1px solid rgba(242, 214, 65, 0.2); font-size: 12px; }
        .points-nudge-confirm strong { color: var(--color-betika-yellow); }

        .icon-btn-ghost { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
        .icon-btn-ghost:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .btn-ghost { background: transparent; border: 1px solid var(--color-border); color: #fff; padding: 16px; border-radius: 12px; font-weight: 800; cursor: pointer; }
        .btn-solid { background: var(--color-betika-green); color: #fff; border: none; padding: 16px; border-radius: 12px; font-weight: 800; cursor: pointer; width: 100%; margin-top: 24px; }
        
        .btn-clear-all { background: transparent; border: none; color: var(--color-text-muted); font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; }
        .btn-clear-all:hover { color: #ef4444; }

        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
