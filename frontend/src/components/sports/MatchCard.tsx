'use client';
import { SportsMatch } from '@/data/sports';
import { useBetSlip } from '@/context/BetSlipContext';
import { ChevronDown, ChevronUp, PlayCircle } from 'lucide-react';
import { useState } from 'react';

export default function MatchCard({ match }: { match: SportsMatch }) {
  const { selections, addSelection, removeSelection, oddsFormat } = useBetSlip();
  const [expanded, setExpanded] = useState(false);

  const isSelected = (selId: string) => selections.some(s => s.id === selId);

  const handleOddsClick = (sel: any, market: any) => {
    if (isSelected(sel.id)) {
      removeSelection(sel.id);
    } else {
      addSelection({
        id: sel.id,
        matchId: match.id,
        matchName: `${match.homeTeam} vs ${match.awayTeam}`,
        marketName: market.name,
        selectionName: sel.name,
        oddsDec: sel.oddsDec,
        oddsFrac: sel.oddsFrac
      });
    }
  };

  return (
    <div className="s-match-card">
      <div className="sm-header">
        <span className="sm-league">{match.league}</span>
        {match.isLive ? (
          <span className="sm-live-badge"><span className="pulse-dot"></span> Live • {match.gameClock}</span>
        ) : (
          <span className="sm-time">{match.gameClock}</span>
        )}
      </div>

      <div className="sm-teams">
         <div className="team-row">
            <span className="team-name">{match.homeTeam}</span>
            {match.score && <span className="team-score">{match.score.home}</span>}
         </div>
         <div className="team-row">
            <span className="team-name">{match.awayTeam}</span>
            {match.score && <span className="team-score">{match.score.away}</span>}
         </div>
      </div>

      <div className="sm-markets">
        {/* Render Primary Market Only unless Expanded */}
        {match.markets.slice(0, expanded ? match.markets.length : 1).map(market => (
          <div key={market.name} className="market-group">
             <div className="market-title">{market.name}</div>
             <div className="odds-row">
                {market.selections.map(sel => (
                   <button 
                     key={sel.id} 
                     className={`odds-btn ${isSelected(sel.id) ? 'selected' : ''}`}
                     onClick={() => handleOddsClick(sel, market)}
                   >
                      <span className="sel-name">{sel.name}</span>
                      <span className="sel-val">{oddsFormat === 'decimal' ? sel.oddsDec.toFixed(2) : sel.oddsFrac}</span>
                   </button>
                ))}
             </div>
          </div>
        ))}
      </div>

      {match.markets.length > 1 && (
        <button className="expand-market-btn" onClick={() => setExpanded(!expanded)}>
           {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} 
           {expanded ? 'Fewer Markets' : `+${match.markets.length - 1} More Markets`}
        </button>
      )}

      <style jsx>{`
        .s-match-card {
          background: var(--color-bg-panel);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          transition: border-color 0.2s;
        }
        .s-match-card:hover { border-color: var(--color-border-hover); }
        
        .sm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .sm-league { font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; }
        .sm-time { font-size: 12px; color: var(--color-text-secondary); }
        .sm-live-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: #ef4444; }
        .pulse-dot { width: 6px; height: 6px; background: #ef4444; border-radius: 50%; box-shadow: 0 0 6px #ef4444; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }

        .sm-teams { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .team-row { display: flex; justify-content: space-between; align-items: center; }
        .team-name { font-weight: 600; color: #fff; font-size: 15px; }
        .team-score { font-weight: 800; color: var(--color-betika-yellow); font-size: 18px; }

        .sm-markets { display: flex; flex-direction: column; gap: 16px; }
        .market-title { font-size: 11px; color: var(--color-text-secondary); margin-bottom: 8px; font-weight: 600; text-align: center; }
        .odds-row { display: flex; gap: 8px; }
        .odds-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
          background: var(--color-bg-input); border: 1px solid var(--color-border); padding: 12px 8px;
          border-radius: 8px; cursor: pointer; transition: all 0.2s;
        }
        .odds-btn:hover { background: var(--color-bg-input-focus); border-color: var(--color-betika-yellow); }
        .odds-btn.selected { background: var(--color-betika-yellow); border-color: var(--color-betika-yellow); }
        
        .odds-btn .sel-name { font-size: 11px; color: var(--color-text-secondary); }
        .odds-btn .sel-val { font-size: 14px; font-weight: 800; color: #fff; }
        
        .odds-btn.selected .sel-name { color: rgba(0,0,0,0.6); }
        .odds-btn.selected .sel-val { color: #000; }

        .expand-market-btn {
          margin-top: 16px; background: transparent; border: none; color: var(--color-text-secondary);
          display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px;
          font-weight: 600; cursor: pointer; padding: 8px; border-radius: 8px;
        }
        .expand-market-btn:hover { color: #fff; background: var(--color-bg-input); }
      `}</style>
    </div>
  );
}
