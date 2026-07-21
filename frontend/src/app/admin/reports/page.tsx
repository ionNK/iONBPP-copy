'use client';

import { useState } from 'react';
import {
  BarChart2, Download, Calendar, Filter, Users, DollarSign,
  TrendingUp, Globe, FileText, ChevronDown, LayoutTemplate, Table as TableIcon,
  CheckSquare, Square, RefreshCcw, Activity, Briefcase, Wallet, ShieldCheck, HeartPulse
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { useCountry } from '@/context/CountryContext';
import LiveMonitoring from '@/components/governance/LiveMonitoring';
import LeadershipReport from '@/components/reports/LeadershipReport';
import FinanceReport from '@/components/reports/FinanceReport';
import ComplianceReport from '@/components/reports/ComplianceReport';
import OperationsHealth from '@/components/reports/OperationsHealth';




// --- Mock Data ---
const MARKET_PERFORMANCE = [
    { market: 'Kenya', revenue: 125000, cost: 45000, participants: 65000 },
    { market: 'Ghana', revenue: 98000, cost: 32000, participants: 42000 },
    { market: 'Ethiopia', revenue: 45000, cost: 18000, participants: 28000 },
    { market: 'Tanzania', revenue: 72000, cost: 24000, participants: 35000 },
    { market: 'Uganda', revenue: 38000, cost: 12000, participants: 15000 },
];

const DAILY_TRENDS = [
    { day: 'Mon', actives: 4200, claims: 2100 },
    { day: 'Tue', actives: 4500, claims: 2300 },
    { day: 'Wed', actives: 5800, claims: 3200 }, // Midweek Boost
    { day: 'Thu', actives: 4600, claims: 2200 },
    { day: 'Fri', actives: 7200, claims: 4500 },
    { day: 'Sat', actives: 12500, claims: 8900 }, // Weekend Peak
    { day: 'Sun', actives: 11200, claims: 7800 },
];

const PROMO_TYPE_DISTRIBUTION = [
    { name: 'Deposit Match', value: 45, color: '#699951' }, // Betika Green
    { name: 'Free Bet', value: 30, color: '#F2D641' },      // Betika Yellow
    { name: 'Cashback', value: 15, color: '#60a5fa' },
    { name: 'Boosts', value: 10, color: '#f87171' },
];

// --- Custom Builder Data ---
const AVAILABLE_METRICS = [
    { id: 'ggr', label: 'GGR (Gross Revenue)' },
    { id: 'ngr', label: 'NGR (Net Revenue)' },
    { id: 'cost', label: 'Bonus Cost / Liability' },
    { id: 'claims', label: 'Total Claims' },
    { id: 'actives', label: 'Active Participants' },
    { id: 'roi', label: 'ROI %' },
    { id: 'avg_stake', label: 'Avg. Stake per Player' },
];

const AVAILABLE_DIMENSIONS = [
    { id: 'date', label: 'Date / Time' },
    { id: 'country', label: 'Market / Country' },
    { id: 'campaign_type', label: 'Campaign Type' },
    { id: 'platform', label: 'Platform (Web/Mobile)' },
    { id: 'segment', label: 'Player Segment' },
];

const MOCK_TABLE_DATA = [
  { date: '2024-02-10', country: 'Kenya', campaign_type: 'Deposit Match', platform: 'Mobile', segment: 'VIP', ggr: '€12,500', ngr: '€9,300', cost: '€4,200', claims: 1205, actives: 3200, roi: '42%', avg_stake: '€3.9' },
  { date: '2024-02-10', country: 'Ghana', campaign_type: 'Free Bet', platform: 'Web', segment: 'New', ggr: '€8,200', ngr: '€6,100', cost: '€2,800', claims: 850, actives: 2100, roi: '38%', avg_stake: '€3.9' },
  { date: '2024-02-11', country: 'Kenya', campaign_type: 'Cashback', platform: 'Mobile', segment: 'All', ggr: '€15,300', ngr: '€11,200', cost: '€5,100', claims: 1450, actives: 4100, roi: '45%', avg_stake: '€3.7' },
  { date: '2024-02-11', country: 'Tanzania', campaign_type: 'Deposit Match', platform: 'Web', segment: 'VIP', ggr: '€6,400', ngr: '€4,600', cost: '€1,900', claims: 540, actives: 1500, roi: '31%', avg_stake: '€4.3' },
  { date: '2024-02-12', country: 'Uganda', campaign_type: 'Boosts', platform: 'Mobile', segment: 'New', ggr: '€3,800', ngr: '€2,700', cost: '€1,200', claims: 320, actives: 900, roi: '28%', avg_stake: '€4.2' },
  { date: '2024-02-12', country: 'Ethiopia', campaign_type: 'Free Bet', platform: 'Web', segment: 'All', ggr: '€5,100', ngr: '€3,900', cost: '€1,500', claims: 480, actives: 1300, roi: '34%', avg_stake: '€3.9' },
];

const AVAILABLE_COUNTRIES = ['Kenya', 'Ghana', 'Ethiopia', 'Tanzania', 'Uganda'];


export default function ReportsPage() {
 const { isInScope, allowedCountries, selectedCountry } = useCountry();

 // Country-scoped datasets. When a specific country is selected only that
 // market is shown; otherwise all permitted markets are aggregated.
 const scopedMarketPerformance = MARKET_PERFORMANCE.filter(m => isInScope(m.market));
 const scopedTableData = MOCK_TABLE_DATA.filter(r => isInScope(r.country));
 // Only offer countries the operator is permitted to see in the builder.
 const scopedAvailableCountries = AVAILABLE_COUNTRIES.filter(c =>
 allowedCountries.some(ac => ac.name === c),
 );

  const [activeTab, setActiveTab] = useState<'overview' | 'leadership' | 'finance' | 'compliance' | 'health' | 'builder' | 'monitor'>('overview');


 const [dateRange, setDateRange] = useState('Last 30 Days');


  // Builder State
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['ggr', 'cost', 'claims']);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['date', 'country']);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [builderPeriod, setBuilderPeriod] = useState('Last 30 Days');

  // Applied config drives the preview table (only changes when "Update Report" is clicked)
  const [appliedConfig, setAppliedConfig] = useState<{
    metrics: string[];
    dimensions: string[];
    countries: string[];
  }>({ metrics: ['ggr', 'cost', 'claims'], dimensions: ['date', 'country'], countries: [] });

  const toggleMetric = (id: string) => {
    if (selectedMetrics.includes(id)) setSelectedMetrics(selectedMetrics.filter(m => m !== id));
    else setSelectedMetrics([...selectedMetrics, id]);
  };

  const toggleDimension = (id: string) => {
    if (selectedDimensions.includes(id)) setSelectedDimensions(selectedDimensions.filter(d => d !== id));
    else setSelectedDimensions([...selectedDimensions, id]);
  };

  const toggleCountry = (name: string) => {
    if (selectedCountries.includes(name)) setSelectedCountries(selectedCountries.filter(c => c !== name));
    else setSelectedCountries([...selectedCountries, name]);
  };

 const activeDimensions = AVAILABLE_DIMENSIONS.filter(d => appliedConfig.dimensions.includes(d.id));
 const activeMetrics = AVAILABLE_METRICS.filter(m => appliedConfig.metrics.includes(m.id));
 // Rows are first restricted to the active country scope, then to any explicit
 // country filters the user selected in the builder.
 const reportRows = scopedTableData.filter(
 row => appliedConfig.countries.length === 0 || appliedConfig.countries.includes(row.country)
 );


  const updateReport = () => {
    setAppliedConfig({
      metrics: [...selectedMetrics],
      dimensions: [...selectedDimensions],
      countries: [...selectedCountries],
    });
  };

  const exportReport = () => {
    const headers = [...activeDimensions.map(d => d.label), ...activeMetrics.map(m => m.label)];
    const lines = reportRows.map(row =>
      [
        ...activeDimensions.map(d => (row as any)[d.id] ?? '-'),
        ...activeMetrics.map(m => `"${String((row as any)[m.id] ?? '-')}"`),
      ].join(',')
    );
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custom-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveTemplate = () => {
    const name = window.prompt('Name this report template:');
    if (!name) return;
    try {
      const key = 'bpp_report_templates';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({
        name,
        metrics: selectedMetrics,
        dimensions: selectedDimensions,
        countries: selectedCountries,
        period: builderPeriod,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(existing));
      window.alert(`Template "${name}" saved.`);
    } catch {
      window.alert('Could not save template.');
    }
  };


    return (
        <div className="reports-container">
            {/* Header */}
        <div className="page-header">
          <div className="header-top">
            <div>
              <h1 className="page-title">Analytics & Reports</h1>
              <span className="scope-indicator">
                <Globe size={12} /> Scope: {selectedCountry ? selectedCountry.name : 'All Markets'}
              </span>
            </div>

            {activeTab === 'overview' && (
              <div className="header-actions">
                <div className="date-picker">
                  <Calendar size={16} />
                  <span>{dateRange}</span>
                  <ChevronDown size={14} />
                </div>
                <button className="btn btn-primary">
                  <Download size={16} /> Export CSV
                </button>
              </div>
        )}
        </div>

      <div className="tab-switcher">


                        <button
                            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                <LayoutTemplate size={16} /> Overview
              </button>
              <button
                className={`tab-btn ${activeTab === 'leadership' ? 'active' : ''}`}
                onClick={() => setActiveTab('leadership')}
              >
                <Briefcase size={16} /> Leadership
              </button>
              <button
                className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
                onClick={() => setActiveTab('finance')}
              >
                <Wallet size={16} /> Finance
              </button>
              <button
                className={`tab-btn ${activeTab === 'compliance' ? 'active' : ''}`}
                onClick={() => setActiveTab('compliance')}
              >
                <ShieldCheck size={16} /> Compliance
              </button>
              <button
                className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
                onClick={() => setActiveTab('health')}
              >
                <HeartPulse size={16} /> Ops Health
              </button>
              <button
                className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}

                            onClick={() => setActiveTab('builder')}
                        >
              <TableIcon size={16} /> Custom Builder
            </button>
            <button
              className={`tab-btn ${activeTab === 'monitor' ? 'active' : ''}`}
              onClick={() => setActiveTab('monitor')}
            >
              <Activity size={16} /> Live Monitoring
            </button>
          </div>
        </div>

      {/* --- OVERVIEW TAB --- */}

            {activeTab === 'overview' && (
                <div className="overview-content animate-fade">
                    {/* KPI Cards */}
                    <div className="kpi-row">
                        <div className="glass-panel kpi-card">
                            <div className="kpi-icon"><DollarSign size={20} color="#4ade80" /></div>
                            <div>
                                <div className="kpi-value">€378.2k</div>
                                <div className="kpi-label">Total GGR Generated</div>
                            </div>
                        </div>
                        <div className="glass-panel kpi-card">
                            <div className="kpi-icon"><TrendingUp size={20} color="#F2D641" /></div>
                            <div>
                                <div className="kpi-value">34.5%</div>
                                <div className="kpi-label">Avg. ROI</div>
                            </div>
                        </div>
                        <div className="glass-panel kpi-card">
                            <div className="kpi-icon"><Users size={20} color="#60a5fa" /></div>
                            <div>
                                <div className="kpi-value">185k</div>
                                <div className="kpi-label">Total Participants</div>
                            </div>
                        </div>
                        <div className="glass-panel kpi-card">
                            <div className="kpi-icon"><FileText size={20} color="#f87171" /></div>
                            <div>
                                <div className="kpi-value">12</div>
                                <div className="kpi-label">Campaigns Analyzed</div>
                            </div>
                        </div>
                    </div>

                    {/* Main Charts */}
                    <div className="charts-grid">
                        {/* ROI by Market */}
                        <div className="glass-panel chart-card col-span-2">
                            <div className="card-header">
                                <h3>Revenue vs Cost by Market</h3>
                                <button className="icon-btn"><Filter size={16} /></button>
                            </div>
                            <div className="chart-area">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={scopedMarketPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>

                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                                        <XAxis dataKey="market" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                                            labelStyle={{ color: 'var(--color-text-primary)' }}
                                            itemStyle={{ color: 'var(--color-text-secondary)' }}
                                            cursor={{ fill: 'var(--color-bg-input)', opacity: 0.4 }}
                                        />
                                        <Legend />
                                        <Bar dataKey="revenue" name="GGR Revenue" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={30} />
                                        <Bar dataKey="cost" name="Bonus Cost" fill="#f87171" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Promo Type Distribution */}
                        <div className="glass-panel chart-card col-span-1">
                            <div className="card-header">
                                <h3>Campaign Types</h3>
                            </div>
                            <div className="chart-area donut-chart">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={PROMO_TYPE_DISTRIBUTION}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {PROMO_TYPE_DISTRIBUTION.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                                            itemStyle={{ color: 'var(--color-text-primary)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="center-text">
                                    <span className="total">4 Types</span>
                                </div>
                            </div>
                        </div>

                        {/* Daily Trends */}
                        <div className="glass-panel chart-card col-span-3">
                            <div className="card-header">
                                <h3>Player Engagement Trends (Last 7 Days)</h3>
                            </div>
                            <div className="chart-area medium-height">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={DAILY_TRENDS} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                                            labelStyle={{ color: 'var(--color-text-primary)' }}
                                            itemStyle={{ color: 'var(--color-text-secondary)' }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="actives" name="Active Players" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4, fill: '#60a5fa' }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="claims" name="Bonus Claims" stroke="#F2D641" strokeWidth={3} dot={{ r: 4, fill: '#F2D641' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CUSTOM BUILDER TAB --- */}
            {activeTab === 'builder' && (
                <div className="builder-layout animate-fade">
                    {/* Left Sidebar: Config */}
                    <div className="glass-panel config-panel">
                        <div className="panel-section">
                            <h3><Filter size={16} /> Dimensions</h3>
                            <div className="checklist">
                                {AVAILABLE_DIMENSIONS.map(dim => (
                                    <div
                                        key={dim.id}
                                        className={`check-item ${selectedDimensions.includes(dim.id) ? 'checked' : ''}`}
                                        onClick={() => toggleDimension(dim.id)}
                                    >
                                        {selectedDimensions.includes(dim.id) ? <CheckSquare size={16} className="check-icon" /> : <Square size={16} className="check-icon" />}
                                        <span>{dim.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="panel-section">
                            <h3><BarChart2 size={16} /> Metrics</h3>
                            <div className="checklist">
                                {AVAILABLE_METRICS.map(metric => (
                                    <div
                                        key={metric.id}
                                        className={`check-item ${selectedMetrics.includes(metric.id) ? 'checked' : ''}`}
                                        onClick={() => toggleMetric(metric.id)}
                                    >
                                        {selectedMetrics.includes(metric.id) ? <CheckSquare size={16} className="check-icon" /> : <Square size={16} className="check-icon" />}
                                        <span>{metric.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

              <div className="panel-section">
              <h3><Globe size={16} /> Countries</h3>
              <div className="checklist">
                {scopedAvailableCountries.map(country => (

                    <div
                      key={country}
                      className={`check-item ${selectedCountries.includes(country) ? 'checked' : ''}`}
                      onClick={() => toggleCountry(country)}
                    >
                      {selectedCountries.includes(country) ? <CheckSquare size={16} className="check-icon" /> : <Square size={16} className="check-icon" />}
                      <span>{country}</span>
                    </div>
                  ))}
                  {selectedCountries.length === 0 && (
                    <span className="filter-hint">All countries included</span>
                  )}
                </div>
              </div>

              <div className="panel-section">
                <h3>Time Period</h3>
                <div className="date-selector">
                  <select
                    className="form-select"
                    value={builderPeriod}
                    onChange={(e) => setBuilderPeriod(e.target.value)}
                  >
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>This Month</option>
                    <option>Custom Range</option>
                  </select>
                </div>
              </div>

              <button className="btn-generate" onClick={updateReport}>
                <RefreshCcw size={14} /> Update Report
              </button>

                    </div>

                    {/* Right Main: Preview */}
                    <div className="glass-panel preview-panel">
                        <div className="preview-header">
                            <div className="preview-title">
                                <h2>Report Preview</h2>
                                <span className="meta-text">{selectedDimensions.length} Dimensions • {selectedMetrics.length} Metrics Selected</span>
                            </div>
              <div className="preview-actions">
                <button className="btn-secondary" onClick={saveTemplate}><FileText size={14} /> Save As Template</button>
                <button className="btn-primary" onClick={exportReport}><Download size={14} /> Export</button>
              </div>
            </div>

            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    {/* Render Dimension Headers */}
                    {activeDimensions.map(d => (
                      <th key={d.id}>{d.label}</th>
                    ))}
                    {/* Render Metric Headers */}
                    {activeMetrics.map(m => (
                      <th key={m.id} className="text-right">{m.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, idx) => (
                    <tr key={idx}>
                      {/* Render Dimension Values (with safeguards) */}
                      {activeDimensions.map(d => (
                        <td key={d.id}>{(row as any)[d.id] || '-'}</td>
                      ))}
                      {/* Render Metric Values */}
                      {activeMetrics.map(m => (
                        <td key={m.id} className="text-right">{(row as any)[m.id] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                  {reportRows.length === 0 && (
                    <tr>
                      <td colSpan={activeDimensions.length + activeMetrics.length} style={{ textAlign: 'center', padding: '32px' }}>
                        No data matches the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="table-footer">
                Showing {reportRows.length} of 1,240 rows
                {appliedConfig.countries.length > 0 && ` • Filtered: ${appliedConfig.countries.join(', ')}`}
              </div>
            </div>

                    </div>
        </div>
      )}

        {/* --- LEADERSHIP / FINANCE / COMPLIANCE / OPS HEALTH TABS --- */}
        {activeTab === 'leadership' && <div className="animate-fade"><LeadershipReport /></div>}
        {activeTab === 'finance' && <div className="animate-fade"><FinanceReport /></div>}
        {activeTab === 'compliance' && <div className="animate-fade"><ComplianceReport /></div>}
        {activeTab === 'health' && <div className="animate-fade"><OperationsHealth /></div>}

        {/* --- LIVE MONITORING TAB --- */}
        {activeTab === 'monitor' && (
          <LiveMonitoring />
        )}


      <style jsx>{`
        .reports-container {

            max-width: 1400px;
            margin: 0 auto;
            padding: 24px;
            color: var(--color-text-primary);
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 32px;
        }
        .header-content { display: flex; align-items: center; gap: 32px; }
        .page-title { font-size: 28px; font-weight: 700; margin: 0; color: var(--color-text-primary); }
        .scope-indicator {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 6px; font-size: 12px; font-weight: 500;
          color: var(--color-betika-yellow);
          background: rgba(242, 214, 65, 0.1);
          border: 1px solid rgba(242, 214, 65, 0.25);
          padding: 3px 10px; border-radius: 20px;
        }

        
        .tab-switcher { display: flex; background: var(--color-bg-input); padding: 4px; border-radius: 8px; border: 1px solid var(--color-border); }
        .tab-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 6px; border: none; background: transparent; color: var(--color-text-secondary); cursor: pointer; transition: all 0.2s; font-size: 13px; font-weight: 500; }
        .tab-btn:hover { color: var(--color-text-primary); }
        .tab-btn.active { background: var(--color-bg-panel); color: var(--color-text-primary); font-weight: 600; box-shadow: var(--shadow-sm); }
        
        .header-actions { display: flex; gap: 12px; }
        
        .date-picker {
            display: flex; align-items: center; gap: 8px;
            background: var(--color-bg-panel);
            border: 1px solid var(--color-border);
            padding: 8px 16px; border-radius: 8px;
            font-size: 13px; color: var(--color-text-primary); cursor: pointer;
            transition: all 0.2s;
        }
        .date-picker:hover { border-color: var(--color-text-muted); }
        
        .btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 20px; border-radius: 8px;
            font-size: 13px; font-weight: 600; cursor: pointer;
            transition: all 0.2s; border: none;
        }
 .btn-primary { background: var(--color-betika-yellow); color: #000; }
 .btn-secondary { background: var(--color-bg-input); color: var(--color-text-primary); border: 1px solid var(--color-border); }

 /* KPI Cards */
 .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px; }
 .glass-panel {
 background: var(--color-bg-elevated);
 border: 1px solid var(--color-border);
 border-radius: 12px;
 backdrop-filter: blur(10px);
 }
        .kpi-card { padding: 20px; display: flex; align-items: center; gap: 16px; }
        .kpi-icon {
            width: 48px; height: 48px; border-radius: 12px;
            background: var(--color-bg-input);
            display: flex; align-items: center; justify-content: center;
            border: 1px solid var(--color-border);
        }
        .kpi-value { font-size: 24px; font-weight: 700; line-height: 1.2; margin-bottom: 2px; color: var(--color-text-primary); }
        .kpi-label { font-size: 12px; color: var(--color-text-secondary); text-transform: uppercase; }

        /* Charts Grid */
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        }
        .col-span-1 { grid-column: span 1; }
        .col-span-2 { grid-column: span 2; }
        .col-span-3 { grid-column: span 3; }
        
        .chart-card { padding: 24px; display: flex; flex-direction: column; }
        .card-header { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .card-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
        
        .icon-btn { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-secondary); padding: 6px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .icon-btn:hover { color: var(--color-text-primary); border-color: var(--color-text-muted); }
        
        .chart-area { flex: 1; min-height: 300px; position: relative; }
        .medium-height { min-height: 350px; }
        
        .donut-chart { display: flex; align-items: center; justify-content: center; }
        .center-text { position: absolute; top: 45%; left: 0; right: 0; text-align: center; pointer-events: none; }
        .total { font-size: 14px; font-weight: 600; color: var(--color-text-secondary); }

        /* --- BUILDER STYLES --- */
        .builder-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; min-height: 600px; }
        .config-panel { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
        .panel-section h3 { font-size: 12px; text-transform: uppercase; color: var(--color-text-secondary); display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        
        .checklist { display: flex; flex-direction: column; gap: 8px; }
        .check-item { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 13px; color: var(--color-text-secondary); }
        .check-item:hover { background: var(--color-bg-input); color: var(--color-text-primary); }
        .check-item.checked { background: rgba(6, 182, 212, 0.1); color: var(--color-accent-cyan); font-weight: 500; }
        .check-icon { opacity: 0.5; }
        .check-item.checked .check-icon { opacity: 1; color: var(--color-accent-cyan); }
        .filter-hint { font-size: 12px; color: var(--color-text-muted); font-style: italic; padding: 4px 8px; }


        .date-selector select { width: 100%; background: var(--color-bg-panel); border: 1px solid var(--color-border); padding: 10px; border-radius: 6px; color: var(--color-text-primary); outline: none; transition: border-color 0.2s; }
        .date-selector select:focus { border-color: var(--color-accent-purple); }
        
        .btn-generate { margin-top: auto; padding: 12px; background: var(--color-accent-cyan); color: #000; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; transition: all 0.2s; }
        .btn-generate:hover { opacity: 0.9; transform: translateY(-1px); }

        .preview-panel { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
        .preview-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: var(--color-bg-input); }
        .preview-title h2 { font-size: 18px; margin: 0 0 4px 0; color: var(--color-text-primary); }
        .meta-text { font-size: 12px; color: var(--color-text-muted); }
        .preview-actions { display: flex; gap: 12px; }

        .table-container { padding: 0; overflow-x: auto; flex: 1; }
        .report-table { width: 100%; border-collapse: collapse; min-width: 800px; }
        .report-table th { padding: 12px 24px; text-align: left; font-size: 11px; text-transform: uppercase; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); background: var(--color-bg-input); white-space: nowrap; }
        .report-table td { padding: 16px 24px; font-size: 13px; border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary); }
        .report-table tr:hover td { background: var(--color-bg-input); color: var(--color-text-primary); }
        
        .text-right { text-align: right; }
        .table-footer { padding: 12px 24px; border-top: 1px solid var(--color-border); font-size: 12px; color: var(--color-text-muted); text-align: right; background: var(--color-bg-input); }

      `}</style>
        </div>
    );
}
