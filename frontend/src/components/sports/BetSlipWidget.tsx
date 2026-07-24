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
    </div>
  );
}
