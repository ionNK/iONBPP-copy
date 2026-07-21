import { Play, Filter, Search } from 'lucide-react';

export default function GamesLibrary() {
  const games = Array.from({ length: 24 }).map((_, i) => ({
    title: `Casino Game ${i + 1}`,
    provider: ['Evolution', 'Pragmatic Play', 'Spribe', 'Play\'n GO'][i % 4],
    color: ['#fbcfe8', '#a78bfa', '#6ee7b7', '#fde047', '#fca5a5', '#93c5fd'][i % 6]
  }));

  return (
    <div className="customer-container">
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="hero-title" style={{ fontSize: '36px', marginBottom: '8px' }}>Game Library</h1>
          <p className="hero-desc">Explore over 2,000 premium slots, tables, and crash games.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
           <div className="search-bar-sm" style={{ padding: '12px 20px', borderRadius: '12px' }}>
              <Search size={18} />
              <input type="text" placeholder="Search games..." style={{ width: '200px' }} />
           </div>
           <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Filter size={18} /> Filters
           </button>
        </div>
      </div>

      <div className="category-chips">
        <div className="chip active">All Games</div>
        <div className="chip">New Releases</div>
        <div className="chip">Slots</div>
        <div className="chip">Live Dealer</div>
        <div className="chip">Jackpots</div>
        <div className="chip">Table Games</div>
      </div>
      
      <div className="game-grid">
        {games.map((game, i) => (
          <div key={i} className="game-card">
            <div className="game-image" style={{ background: `linear-gradient(135deg, ${game.color}22 0%, var(--color-bg-card) 100%)` }}>
              <span style={{ fontSize: '48px', opacity: 0.1, fontWeight: 900 }}>{game.title.split(' ')[2]}</span>
            </div>
            <div className="play-btn">
              <Play size={20} color="#fff" fill="#fff" />
            </div>
            <div className="game-overlay">
              <h3 className="game-title">{game.title}</h3>
              <p className="game-provider">{game.provider}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px', marginBottom: '48px' }}>
        <button className="btn-outline">Load More Games</button>
      </div>
    </div>
  );
}
