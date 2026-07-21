import { DUMMY_SPORTS_DATA } from '@/data/sports';
import MatchCard from '@/components/sports/MatchCard';
import { Trophy, Activity, CalendarDays } from 'lucide-react';

export default function SportsbookPage() {
  const liveMatches = DUMMY_SPORTS_DATA.filter(m => m.isLive);
  const upcomingMatches = DUMMY_SPORTS_DATA.filter(m => !m.isLive);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
         <h1 className="hero-title" style={{ fontSize: '32px', margin: 0 }}>Sportsbook</h1>
         <div className="search-bar-sm" style={{ padding: '12px 20px', borderRadius: '12px', background: 'var(--color-bg-input)' }}>
           <input type="text" placeholder="Search teams, leagues..." style={{ width: '250px', background: 'transparent', border: 'none', color: '#fff' }} />
         </div>
      </div>

      <div className="sports-nav">
        <button className="s-nav-tab active">Top Sports</button>
        <button className="s-nav-tab">Football</button>
        <button className="s-nav-tab">Basketball</button>
        <button className="s-nav-tab">Tennis</button>
        <button className="s-nav-tab">Esports</button>
        <button className="s-nav-tab">Horse Racing</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
         <div className="chip active">All Competitions</div>
         <div className="chip">Premier League</div>
         <div className="chip">Champions League</div>
         <div className="chip">NBA</div>
      </div>

      <section style={{ marginBottom: '48px' }}>
         <div className="section-header">
            <h2 className="section-title"><Activity size={24} color="#ef4444" /> Live In-Play</h2>
         </div>
         <div className="matches-grid">
            {liveMatches.map(match => (
               <MatchCard key={match.id} match={match} />
            ))}
         </div>
      </section>

      <section style={{ marginBottom: '80px' }}>
         <div className="section-header">
            <h2 className="section-title"><CalendarDays size={24} color="var(--color-betika-yellow)" /> Top Upcoming Matches</h2>
         </div>
         <div className="matches-grid">
            {upcomingMatches.map(match => (
               <MatchCard key={match.id} match={match} />
            ))}
         </div>
      </section>
    </div>
  );
}
