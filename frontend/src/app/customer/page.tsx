'use client';
import { Flame, Star, Zap, Trophy, ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

export default function CustomerLobby() {
  return (
    <div className="customer-container">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <span className="hero-tag">Welcome Back</span>
          <h1 className="hero-title">Your 200% Deposit Match is Ready.</h1>
          <p className="hero-desc">Experience hyper-realistic gaming with the all-new Betika Casino. Claim your bonus and start playing trending slots today.</p>
          <button className="btn-cta">Claim Bonus Now</button>
        </div>
      </section>

      {/* Rewards Nudge Widget */}
      <section className="rewards-nudge-section">
        <div className="rewards-nudge-card">
          <div className="nudge-left">
            <div className="nudge-icon-box">
              <Trophy size={28} color="var(--color-betika-yellow)" />
            </div>
            <div className="nudge-text">
              <div className="nudge-tier">GOLD TIER Member</div>
              <h3 className="nudge-title">You have 6,240 Reward Points</h3>
              <p className="nudge-desc">Redeem your points for Free Bets, Profit Boosts, and exclusive VIP rewards.</p>
            </div>
          </div>
          <div className="nudge-right">
            <div className="nudge-progress-group">
              <div className="nudge-pg-label">
                <span>Next Tier: <strong>Platinum</strong></span>
                <span>42%</span>
              </div>
              <div className="nudge-bar-bg">
                <div className="nudge-bar-fill" style={{ width: '42%' }}></div>
              </div>
            </div>
            <Link href="/customer/rewards" className="btn-nudge-action">
              Redeem Rewards <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <div className="category-chips">
        <div className="chip active">All Games</div>
        <div className="chip">Slots</div>
        <div className="chip">Live Casino</div>
        <div className="chip">Crash Games</div>
        <div className="chip">Table Games</div>
        <div className="chip">Virtual Sports</div>
      </div>

      {/* Trending Block */}
      <section>
        <div className="section-header">
          <h2 className="section-title"><Flame size={24} color="#ef4444" /> Trending Now</h2>
          <Link href="/customer/games" className="view-all">View All</Link>
        </div>

        <div className="game-grid">
          {[
            { title: "Sweet Bonanza", provider: "Pragmatic Play", color: "#fbcfe8" },
            { title: "Aviator", provider: "Spribe", color: "#fca5a5" },
            { title: "Gates of Olympus", provider: "Pragmatic Play", color: "#fde047" },
            { title: "Lightning Roulette", provider: "Evolution", color: "#a78bfa" },
            { title: "Crazy Time", provider: "Evolution", color: "#6ee7b7" },
            { title: "Book of Dead", provider: "Play'n GO", color: "#fcd34d" },
          ].map((game, i) => (
            <div key={i} className="game-card">
              <div className="game-image" style={{ background: `linear-gradient(135deg, ${game.color}22 0%, var(--color-bg-card) 100%)` }}>
                <span style={{ fontSize: '48px', opacity: 0.1, fontWeight: 900 }}>{game.title.charAt(0)}</span>
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
      </section>

      {/* Live Casino Focus */}
      <section>
        <div className="section-header">
          <h2 className="section-title"><Zap size={24} color="#06b6d4" /> Live Action</h2>
          <Link href="/customer/games" className="view-all">View Live Casino</Link>
        </div>

        <div className="game-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { title: "XXXTreme Lightning Roulette", provider: "Evolution", color: "#c084fc" },
            { title: "Blackjack VIP", provider: "Evolution", color: "#9ca3af" },
            { title: "Mega Wheel", provider: "Pragmatic Play Live", color: "#fca5a5" },
            { title: "Baccarat Squeeze", provider: "Evolution", color: "#699951" },
          ].map((game, i) => (
            <div key={i} className="game-card" style={{ aspectRatio: '16/9' }}>
              <div className="game-image" style={{ background: `linear-gradient(135deg, ${game.color}33 0%, var(--color-bg-card) 100%)` }}></div>
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
      </section>

      {/* Promotions Block */}
      <section>
        <div className="section-header" style={{ marginTop: '32px' }}>
          <h2 className="section-title"><Star size={24} color="#F2D641" /> Player Promotions</h2>
          <Link href="/customer/promotions" className="view-all">View All Promos</Link>
        </div>

        <div className="promo-grid">
          <div className="promo-card" style={{ borderLeft: '4px solid var(--color-betika-green)' }}>
            <div className="promo-info">
              <h3 className="promo-name">Weekend Cashback</h3>
              <p className="promo-desc">Get 10% back on your losses every Saturday and Sunday.</p>
              <button className="btn-outline">Opt In Now</button>
            </div>
          </div>

          <div className="promo-card" style={{ borderLeft: '4px solid var(--color-accent-purple)' }}>
            <div className="promo-info">
              <h3 className="promo-name">Crash Game Drop</h3>
              <p className="promo-desc">Random free bet drops while playing Aviator or Spaceman.</p>
              <button className="btn-outline">Play Crash</button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .customer-container { 
            max-width: 1400px; margin: 0 auto; padding: 40px; 
            display: flex; flex-direction: column; gap: 40px;
        }
        .hero-banner { 
            background: linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%), url('/assets/casino-hero.jpg');
            background-size: cover; background-position: center; border-radius: 24px; padding: 64px;
            min-height: 400px; display: flex; align-items: center; border: 1px solid var(--color-border);
        }
        .hero-title { font-size: 48px; font-weight: 900; margin: 12px 0 20px; max-width: 600px; line-height: 1.1; }
        .hero-desc { font-size: 18px; color: var(--color-text-secondary); max-width: 500px; margin-bottom: 32px; }
        .btn-cta { background: var(--color-betika-green); color: #fff; border: none; padding: 16px 32px; border-radius: 12px; font-weight: 800; cursor: pointer; }

        .rewards-nudge-section { margin-top: -20px; }
        .rewards-nudge-card { 
            background: linear-gradient(90deg, #1a1a1a 0%, #0f172a 100%);
            border: 1px solid var(--color-border); border-radius: 20px; padding: 24px 32px;
            display: flex; justify-content: space-between; align-items: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }
        .nudge-left { display: flex; align-items: center; gap: 24px; }
        .nudge-icon-box { 
            width: 60px; height: 60px; background: rgba(242, 214, 65, 0.1); 
            border-radius: 16px; display: flex; align-items: center; justify-content: center;
        }
        .nudge-tier { color: var(--color-betika-yellow); font-size: 11px; font-weight: 900; letter-spacing: 1px; }
        .nudge-title { font-size: 22px; font-weight: 900; margin: 4px 0; }
        .nudge-desc { font-size: 13px; color: var(--color-text-muted); margin: 0; }
        
        .nudge-right { display: flex; align-items: center; gap: 40px; }
        .nudge-progress-group { width: 240px; }
        .nudge-pg-label { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; color: var(--color-text-secondary); }
        .nudge-bar-bg { height: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden; }
        .nudge-bar-fill { height: 100%; background: var(--color-betika-green); border-radius: 4px; }
        
        .btn-nudge-action { 
            background: var(--color-betika-yellow); color: #000; padding: 14px 24px; 
            border-radius: 12px; font-weight: 900; text-decoration: none; display: flex; 
            align-items: center; gap: 8px; transition: 0.2s;
        }
        .btn-nudge-action:hover { transform: translateY(-2px); filter: brightness(1.1); }

        .category-chips { display: flex; gap: 12px; }
        .chip { background: var(--color-bg-input); border: 1px solid var(--color-border); padding: 10px 20px; border-radius: 20px; color: var(--color-text-secondary); font-weight: 700; cursor: pointer; font-size: 14px; }
        .chip.active { background: var(--color-betika-yellow); color: #000; border-color: var(--color-betika-yellow); }

        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .section-title { font-size: 22px; font-weight: 900; display: flex; align-items: center; gap: 12px; color: #fff; }
        .view-all { color: var(--color-betika-yellow); text-decoration: none; font-weight: 700; font-size: 14px; }

        .game-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 20px; }
        .game-card { 
            position: relative; border-radius: 16px; overflow: hidden; aspect-ratio: 3/4; 
            border: 1px solid var(--color-border); background: var(--color-bg-card); cursor: pointer;
        }
        .game-image { height: 100%; display: flex; align-items: center; justify-content: center; }
        .game-overlay { 
            position: absolute; bottom: 0; left: 0; right: 0; padding: 16px; 
            background: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
        }
        .game-title { font-size: 14px; font-weight: 800; margin: 0; }
        .game-provider { font-size: 11px; color: var(--color-text-muted); margin: 4px 0 0 0; }
        .play-btn { 
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.8);
            background: var(--color-betika-green); width: 48px; height: 48px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s;
        }
        .game-card:hover .play-btn { opacity: 1; transform: translate(-50%, -50%) scale(1); }

        .promo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .promo-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 16px; padding: 24px; display: flex; justify-content: space-between; }
        .promo-name { font-size: 20px; font-weight: 900; margin: 0 0 8px 0; }
        .promo-desc { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 20px; }
        .btn-outline { background: transparent; border: 1px solid var(--color-border); color: #fff; padding: 10px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; }
        
        @media (max-width: 1200px) {
            .game-grid { grid-template-columns: repeat(4, 1fr); }
            .rewards-nudge-card { flex-direction: column; gap: 24px; align-items: flex-start; }
            .nudge-right { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
}
