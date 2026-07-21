'use client';
import { ArrowUpRight, ArrowDownRight, Users, Ticket, Wallet, Activity, MoreHorizontal, Bell, Plus, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, PieChart, Pie } from 'recharts';
import { useState, useEffect } from 'react';

const ACTIVITY_DATA = [
  { name: 'Mon', claims: 4000, value: 2400 },
  { name: 'Tue', claims: 3000, value: 1398 },
  { name: 'Wed', claims: 2000, value: 9800 },
  { name: 'Thu', claims: 2780, value: 3908 },
  { name: 'Fri', claims: 1890, value: 4800 },
  { name: 'Sat', claims: 2390, value: 3800 },
  { name: 'Sun', claims: 3490, value: 4300 },
];

const REVENUE_DATA = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
];

const COST_DISTRIBUTION = [
  { name: 'Bonus', value: 400, color: '#F2D641' },
  { name: 'Cashback', value: 300, color: '#a855f7' },
  { name: 'Free Bets', value: 300, color: '#06b6d4' },
];

const PROFIT_MARGINS = [
  { name: 'Q1', ggr: 120, cost: 80 },
  { name: 'Q2', ggr: 150, cost: 90 },
  { name: 'Q3', ggr: 180, cost: 100 },
  { name: 'Q4', ggr: 200, cost: 110 },
];

const CAMPAIGN_PERFORMANCE = [
  { name: 'Welcome', value: 400, color: '#F2D641' },
  { name: 'Retention', value: 300, color: '#a855f7' },
  { name: 'VIP', value: 300, color: '#06b6d4' },
  { name: 'Sports', value: 200, color: '#699951' },
];

const MARKET_PERFORMANCE = [
  { name: 'Kenya', value: 85, color: '#F2D641' },   // Yellow
  { name: 'Ghana', value: 65, color: '#a855f7' },   // Purple
  { name: 'Zambia', value: 45, color: '#06b6d4' },  // Cyan
  { name: 'Uganda', value: 30, color: '#22c55e' },  // Green
  { name: 'Tanzania', value: 25, color: '#ef4444' }, // Red
];

const SEGMENT_ENGAGEMENT = [
  { subject: 'New Users', A: 120, fullMark: 150 },
  { subject: 'VIP', A: 98, fullMark: 150 },
  { subject: 'Churn Risk', A: 86, fullMark: 150 },
  { subject: 'Sports', A: 99, fullMark: 150 },
  { subject: 'Casino', A: 85, fullMark: 150 },
  { subject: 'Crash Games', A: 65, fullMark: 150 },
];

export default function Dashboard() {
  const [activePromotions, setActivePromotions] = useState<any[]>([]);

  useEffect(() => {
    // Load promotions from local storage to simulate persistence
    const saved = JSON.parse(localStorage.getItem('saved_promotions') || '[]');
    // Mock data if empty
    if (saved.length === 0) {
      const mocks = [
        { id: 101, name: 'Cashia Launch Cashback', type: 'Cashback', market: 'KE', status: 'Active', engagement: '12%', claims: 1450 },
        { id: 102, name: 'Super League Welcome', type: 'Deposit Match', market: 'GH', status: 'Active', engagement: '24%', claims: 3890 },
        { id: 103, name: 'Midweek Jackpot Boost', type: 'Bonus', market: 'All', status: 'Paused', engagement: '8%', claims: 560 },
      ];
      setActivePromotions(mocks);
      localStorage.setItem('saved_promotions', JSON.stringify(mocks));
    } else {
      // Normalize data to ensure 'claims' exists (handle legacy vs new structure)
      const normalized = saved.map((p: any) => ({
        ...p,
        claims: p.claims !== undefined ? p.claims : (p.stats?.claims || 0)
      }));
      setActivePromotions(normalized);
    }
  }, []);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Command Center</h1>
          <p className="dash-subtitle">Real-time platform overview and analytics.</p>
        </div>
        <div className="header-actions">
          <div className="date-picker-placeholder">
            <span>Today: {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <Link href="/admin/promotions/create" className="btn-primary-header">
            <Plus size={18} /> New Promotion
          </Link>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="stats-grid">
        <StatsCard
          title="Active Claims"
          value="12,845"
          change="+12.5%"
          trend="up"
          icon={Ticket}
          color="var(--color-betika-yellow)"
        />
        <StatsCard
          title="Liability Exposure"
          value="€1.2M"
          change="-2.4%"
          trend="down"
          icon={Wallet}
          color="var(--color-accent-purple)"
        />
        <StatsCard
          title="Active Players"
          value="84,392"
          change="+5.2%"
          trend="up"
          icon={Users}
          color="var(--color-accent-cyan)"
        />
        <StatsCard
          title="Conversion Rate"
          value="24.8%"
          change="-0.5%"
          trend="down"
          icon={Activity}
          color="var(--color-betika-green)"
        />
      </div>

      {/* Financial Charts Row */}
      <div className="financial-grid">
        {/* Revenue Trends */}
        <div className="glass-panel chart-panel-sm">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Revenue Trends</h3>
              <p className="panel-subtitle">NGR Performance</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-panel)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                  labelStyle={{ color: 'var(--color-text-secondary)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#22c55e" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Distribution */}
        <div className="glass-panel chart-panel-sm">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Cost Distribution</h3>
              <p className="panel-subtitle">Promo Spend breakdown</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={COST_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COST_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-panel)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'var(--color-text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Margins */}
        <div className="glass-panel chart-panel-sm">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Profit Margins</h3>
              <p className="panel-subtitle">GGR vs Costs</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={PROFIT_MARGINS}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-panel)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'var(--color-text-secondary)' }} />
                <Bar dataKey="ggr" name="GGR" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="cost" name="Costs" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="secondary-grid">
        {/* Market Performance */}
        <div className="glass-panel chart-panel-sm">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Market Performance</h3>
              <p className="panel-subtitle">Engagement by region</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={MARKET_PERFORMANCE}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'var(--color-border)', opacity: 0.1 }}
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-panel)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {MARKET_PERFORMANCE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segment Activity */}
        <div className="glass-panel chart-panel-sm">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Segment Activity</h3>
              <p className="panel-subtitle">Real-time player participation</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={SEGMENT_ENGAGEMENT}>
                <PolarGrid stroke="var(--color-border)" opacity={0.3} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar
                  name="Engagement"
                  dataKey="A"
                  stroke="var(--color-betika-yellow)"
                  fill="var(--color-betika-yellow)"
                  fillOpacity={0.4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-panel)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Promotions List Section */}
      <div className="glass-panel list-panel mb-8">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Active Promotions</h3>
            <p className="panel-subtitle">Manage your running campaigns</p>
          </div>
          <div className="list-actions">
            <div className="search-bar">
              <Search size={14} />
              <input type="text" placeholder="Search..." />
            </div>
            <button className="icon-btn"><Filter size={16} /></button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="promo-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Market</th>
                <th>Status</th>
                <th>Engagement</th>
                <th>Claims</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activePromotions.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="p-name">{p.name}</div>
                    <div className="p-id">#{p.id}</div>
                  </td>
                  <td><span className="badge-type">{p.type}</span></td>
                  <td><span className="market-tag">{p.market}</span></td>
                  <td>
                    <span className={`status-dot ${p.status.toLowerCase()}`}></span> {p.status}
                  </td>
                  <td>{p.engagement}</td>
                  <td>{p.claims.toLocaleString()}</td>
                  <td><button className="action-dots"><MoreHorizontal size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-grid">
        {/* Main Chart */}
        <div className="glass-panel chart-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Traffic & Claims Volume</h3>
              <p className="panel-subtitle">Daily claim volume vs. value generated</p>
            </div>
            <div className="legend">
              <span className="dot yellow" /> Claims
              <span className="dot purple" /> Value
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={ACTIVITY_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F2D641" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F2D641" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="claims" stroke="#F2D641" strokeWidth={2} fillOpacity={1} fill="url(#colorClaims)" />
                <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Widgets */}
        <div className="side-column">
          {/* Campaign Performance Bar */}
          <div className="glass-panel widget-panel">
            <h3 className="panel-title mb-4">Top Campaigns</h3>
            <div className="mini-chart-wrapper">
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={CAMPAIGN_PERFORMANCE} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#fff" fontSize={11} width={60} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#09090b', border: 'none' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {CAMPAIGN_PERFORMANCE.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Live Feed */}
          <div className="glass-panel widget-panel flex-1">
            <div className="panel-header-row">
              <h3 className="panel-title">Live Feed</h3>
              <div className="live-indicator"><span className="pulse" /> Live</div>
            </div>
            <div className="feed-list">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="feed-item">
                  <div className="feed-icon"><Bell size={12} /></div>
                  <div className="feed-content">
                    <p className="feed-msg">User <span className="text-white">JohnD</span> claimed <span className="text-yellow">Welcome Bonus</span></p>
                    <span className="feed-time">2 mins ago</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

function StatsCard({ title, value, change, trend, icon: Icon, color }: any) {
  return (
    <div className="glass-panel stats-card">
      <div className="icon-row">
        <div className="icon-box" style={{ color: color, background: color + '15' }}>
          <Icon size={20} />
        </div>
        <div className="trend-badge" style={{ color: trend === 'up' ? 'var(--color-betika-green)' : '#ef4444' }}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
    </div>
  )
}
