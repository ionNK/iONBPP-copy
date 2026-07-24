'use client';
import { Flame, Star, Zap, Trophy, ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

export default function CustomerLobby() {
  return (
    <div className="customer-container customer-home">
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
                <span className="game-initial">{game.title.charAt(0)}</span>
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

        <div className="game-grid live-game-grid">
          {[
            { title: "XXXTreme Lightning Roulette", provider: "Evolution", color: "#c084fc" },
            { title: "Blackjack VIP", provider: "Evolution", color: "#9ca3af" },
            { title: "Mega Wheel", provider: "Pragmatic Play Live", color: "#fca5a5" },
            { title: "Baccarat Squeeze", provider: "Evolution", color: "#699951" },
          ].map((game, i) => (
            <div key={i} className="game-card live-game-card">
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
        <div className="section-header promotions-section-header">
          <h2 className="section-title"><Star size={24} color="#F2D641" /> Player Promotions</h2>
          <Link href="/customer/promotions" className="view-all">View All Promos</Link>
        </div>

        <div className="promo-grid">
          <div className="promo-card promo-card-green">
            <div className="promo-info">
              <h3 className="promo-name">Weekend Cashback</h3>
              <p className="promo-desc">Get 10% back on your losses every Saturday and Sunday.</p>
              <button className="btn-outline">Opt In Now</button>
            </div>
          </div>

          <div className="promo-card promo-card-purple">
            <div className="promo-info">
              <h3 className="promo-name">Crash Game Drop</h3>
              <p className="promo-desc">Random free bet drops while playing Aviator or Spaceman.</p>
              <button className="btn-outline">Play Crash</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
