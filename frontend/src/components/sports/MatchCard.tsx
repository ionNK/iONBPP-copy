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
    </div>
  );
}
