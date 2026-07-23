'use client';

import { useState, useEffect } from 'react';
import {
    Settings, Users, Shield, Bell, Database, Save, CheckCircle2, Power,
 CreditCard, Globe, Key, Webhook, Mail, Plus, Trash2, Sun, Moon, Monitor, Sparkles,
 Book, FileCode, ExternalLink, HelpCircle, FileText, PlayCircle, Activity, SlidersHorizontal // Added icons
} from 'lucide-react';
import ExplainerVideo from '@/components/onboarding/ExplainerVideo';
import SupportCenter from '@/components/settings/SupportCenter';
import SystemStatusTab from '@/components/settings/SystemStatusTab';
import SimulatorTab from '@/components/settings/SimulatorTab';
import UserManagementPanel from '@/components/settings/UserManagementPanel';
import FeatureConfigurationPanel from '@/components/settings/FeatureConfigurationPanel';
import { useTheme } from '@/context/ThemeContext';

// --- Types ---
interface CountryConfig {
    code: string;
    name: string;
    currency: string;
    countryLimit: number; // Max total payout/cap for the country market
    promoLimit: number;   // Max cap for a single promotion
}

// --- Mock Data ---
const USERS = [
    { id: 1, name: 'Admin User', role: 'Super Admin', email: 'admin@betika.com', status: 'Active' },
    { id: 2, name: 'Sarah K.', role: 'CRM Manager', email: 'sarah.k@betika.com', status: 'Active' },
    { id: 3, name: 'David O.', role: 'Analyst', email: 'david.o@betika.com', status: 'Inactive' },
];

const INTEGRATIONS = [
    { id: 'twilio', name: 'Twilio SMS', status: 'connected', icon: 'T' },
    { id: 'sendgrid', name: 'SendGrid Email', status: 'connected', icon: 'S' },
    { id: 'segment', name: 'Segment.io', status: 'disconnected', icon: 'Io' },
];

const getFlagEmoji = (countryCode: string) => {
    if (!countryCode) return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

const AVAILABLE_COUNTRIES = [
    { code: 'AF', name: 'Afghanistan', currency: 'AFN' },
    { code: 'AL', name: 'Albania', currency: 'ALL' },
    { code: 'DZ', name: 'Algeria', currency: 'DZD' },
    { code: 'AD', name: 'Andorra', currency: 'EUR' },
    { code: 'AO', name: 'Angola', currency: 'AOA' },
    { code: 'AG', name: 'Antigua and Barbuda', currency: 'XCD' },
    { code: 'AR', name: 'Argentina', currency: 'ARS' },
    { code: 'AM', name: 'Armenia', currency: 'AMD' },
    { code: 'AU', name: 'Australia', currency: 'AUD' },
    { code: 'AT', name: 'Austria', currency: 'EUR' },
    { code: 'AZ', name: 'Azerbaijan', currency: 'AZN' },
    { code: 'BS', name: 'Bahamas', currency: 'BSD' },
    { code: 'BH', name: 'Bahrain', currency: 'BHD' },
    { code: 'BD', name: 'Bangladesh', currency: 'BDT' },
    { code: 'BB', name: 'Barbados', currency: 'BBD' },
    { code: 'BY', name: 'Belarus', currency: 'BYN' },
    { code: 'BE', name: 'Belgium', currency: 'EUR' },
    { code: 'BZ', name: 'Belize', currency: 'BZD' },
    { code: 'BJ', name: 'Benin', currency: 'XOF' },
    { code: 'BT', name: 'Bhutan', currency: 'BTN' },
    { code: 'BO', name: 'Bolivia', currency: 'BOB' },
    { code: 'BA', name: 'Bosnia and Herzegovina', currency: 'BAM' },
    { code: 'BW', name: 'Botswana', currency: 'BWP' },
    { code: 'BR', name: 'Brazil', currency: 'BRL' },
    { code: 'BN', name: 'Brunei', currency: 'BND' },
    { code: 'BG', name: 'Bulgaria', currency: 'BGN' },
    { code: 'BF', name: 'Burkina Faso', currency: 'XOF' },
    { code: 'BI', name: 'Burundi', currency: 'BIF' },
    { code: 'CV', name: 'Cabo Verde', currency: 'CVE' },
    { code: 'KH', name: 'Cambodia', currency: 'KHR' },
    { code: 'CM', name: 'Cameroon', currency: 'XAF' },
    { code: 'CA', name: 'Canada', currency: 'CAD' },
    { code: 'CF', name: 'Central African Republic', currency: 'XAF' },
    { code: 'TD', name: 'Chad', currency: 'XAF' },
    { code: 'CL', name: 'Chile', currency: 'CLP' },
    { code: 'CN', name: 'China', currency: 'CNY' },
    { code: 'CO', name: 'Colombia', currency: 'COP' },
    { code: 'KM', name: 'Comoros', currency: 'KMF' },
    { code: 'CD', name: 'Congo (DRC)', currency: 'CDF' },
    { code: 'CG', name: 'Congo (Republic)', currency: 'XAF' },
    { code: 'CR', name: 'Costa Rica', currency: 'CRC' },
    { code: 'HR', name: 'Croatia', currency: 'EUR' },
    { code: 'CU', name: 'Cuba', currency: 'CUP' },
    { code: 'CY', name: 'Cyprus', currency: 'EUR' },
    { code: 'CZ', name: 'Czech Republic', currency: 'CZK' },
    { code: 'DK', name: 'Denmark', currency: 'DKK' },
    { code: 'DJ', name: 'Djibouti', currency: 'DJF' },
    { code: 'DM', name: 'Dominica', currency: 'XCD' },
    { code: 'DO', name: 'Dominican Republic', currency: 'DOP' },
    { code: 'EC', name: 'Ecuador', currency: 'USD' },
    { code: 'EG', name: 'Egypt', currency: 'EGP' },
    { code: 'SV', name: 'El Salvador', currency: 'USD' },
    { code: 'GQ', name: 'Equatorial Guinea', currency: 'XAF' },
    { code: 'ER', name: 'Eritrea', currency: 'ERN' },
    { code: 'EE', name: 'Estonia', currency: 'EUR' },
    { code: 'SZ', name: 'Eswatini', currency: 'SZL' },
    { code: 'ET', name: 'Ethiopia', currency: 'ETB' },
    { code: 'FJ', name: 'Fiji', currency: 'FJD' },
    { code: 'FI', name: 'Finland', currency: 'EUR' },
    { code: 'FR', name: 'France', currency: 'EUR' },
    { code: 'GA', name: 'Gabon', currency: 'XAF' },
    { code: 'GM', name: 'Gambia', currency: 'GMD' },
    { code: 'GE', name: 'Georgia', currency: 'GEL' },
    { code: 'DE', name: 'Germany', currency: 'EUR' },
    { code: 'GH', name: 'Ghana', currency: 'GHS' },
    { code: 'GR', name: 'Greece', currency: 'EUR' },
    { code: 'GD', name: 'Grenada', currency: 'XCD' },
    { code: 'GT', name: 'Guatemala', currency: 'GTQ' },
    { code: 'GN', name: 'Guinea', currency: 'GNF' },
    { code: 'GW', name: 'Guinea-Bissau', currency: 'XOF' },
    { code: 'GY', name: 'Guyana', currency: 'GYD' },
    { code: 'HT', name: 'Haiti', currency: 'HTG' },
    { code: 'HN', name: 'Honduras', currency: 'HNL' },
    { code: 'HU', name: 'Hungary', currency: 'HUF' },
    { code: 'IS', name: 'Iceland', currency: 'ISK' },
    { code: 'IN', name: 'India', currency: 'INR' },
    { code: 'ID', name: 'Indonesia', currency: 'IDR' },
    { code: 'IR', name: 'Iran', currency: 'IRR' },
    { code: 'IQ', name: 'Iraq', currency: 'IQD' },
    { code: 'IE', name: 'Ireland', currency: 'EUR' },
    { code: 'IL', name: 'Israel', currency: 'ILS' },
    { code: 'IT', name: 'Italy', currency: 'EUR' },
    { code: 'JM', name: 'Jamaica', currency: 'JMD' },
    { code: 'JP', name: 'Japan', currency: 'JPY' },
    { code: 'JO', name: 'Jordan', currency: 'JOD' },
    { code: 'KZ', name: 'Kazakhstan', currency: 'KZT' },
    { code: 'KE', name: 'Kenya', currency: 'KES' },
    { code: 'KI', name: 'Kiribati', currency: 'AUD' },
    { code: 'KP', name: 'North Korea', currency: 'KPW' },
    { code: 'KR', name: 'South Korea', currency: 'KRW' },
    { code: 'KW', name: 'Kuwait', currency: 'KWD' },
    { code: 'KG', name: 'Kyrgyzstan', currency: 'KGS' },
    { code: 'LA', name: 'Laos', currency: 'LAK' },
    { code: 'LV', name: 'Latvia', currency: 'EUR' },
    { code: 'LB', name: 'Lebanon', currency: 'LBP' },
    { code: 'LS', name: 'Lesotho', currency: 'LSL' },
    { code: 'LR', name: 'Liberia', currency: 'LRD' },
    { code: 'LY', name: 'Libya', currency: 'LYD' },
    { code: 'LI', name: 'Liechtenstein', currency: 'CHF' },
    { code: 'LT', name: 'Lithuania', currency: 'EUR' },
    { code: 'LU', name: 'Luxembourg', currency: 'EUR' },
    { code: 'MG', name: 'Madagascar', currency: 'MGA' },
    { code: 'MW', name: 'Malawi', currency: 'MWK' },
    { code: 'MY', name: 'Malaysia', currency: 'MYR' },
    { code: 'MV', name: 'Maldives', currency: 'MVR' },
    { code: 'ML', name: 'Mali', currency: 'XOF' },
    { code: 'MT', name: 'Malta', currency: 'EUR' },
    { code: 'MH', name: 'Marshall Islands', currency: 'USD' },
    { code: 'MR', name: 'Mauritania', currency: 'MRU' },
    { code: 'MU', name: 'Mauritius', currency: 'MUR' },
    { code: 'MX', name: 'Mexico', currency: 'MXN' },
    { code: 'FM', name: 'Micronesia', currency: 'USD' },
    { code: 'MD', name: 'Moldova', currency: 'MDL' },
    { code: 'MC', name: 'Monaco', currency: 'EUR' },
    { code: 'MN', name: 'Mongolia', currency: 'MNT' },
    { code: 'ME', name: 'Montenegro', currency: 'EUR' },
    { code: 'MA', name: 'Morocco', currency: 'MAD' },
    { code: 'MZ', name: 'Mozambique', currency: 'MZN' },
    { code: 'MM', name: 'Myanmar', currency: 'MMK' },
    { code: 'NA', name: 'Namibia', currency: 'NAD' },
    { code: 'NR', name: 'Nauru', currency: 'AUD' },
    { code: 'NP', name: 'Nepal', currency: 'NPR' },
    { code: 'NL', name: 'Netherlands', currency: 'EUR' },
    { code: 'NZ', name: 'New Zealand', currency: 'NZD' },
    { code: 'NI', name: 'Nicaragua', currency: 'NIO' },
    { code: 'NE', name: 'Niger', currency: 'XOF' },
    { code: 'NG', name: 'Nigeria', currency: 'NGN' },
    { code: 'MK', name: 'North Macedonia', currency: 'MKD' },
    { code: 'NO', name: 'Norway', currency: 'NOK' },
    { code: 'OM', name: 'Oman', currency: 'OMR' },
    { code: 'PK', name: 'Pakistan', currency: 'PKR' },
    { code: 'PW', name: 'Palau', currency: 'USD' },
    { code: 'PA', name: 'Panama', currency: 'PAB' },
    { code: 'PG', name: 'Papua New Guinea', currency: 'PGK' },
    { code: 'PY', name: 'Paraguay', currency: 'PYG' },
    { code: 'PE', name: 'Peru', currency: 'PEN' },
    { code: 'PH', name: 'Philippines', currency: 'PHP' },
    { code: 'PL', name: 'Poland', currency: 'PLN' },
    { code: 'PT', name: 'Portugal', currency: 'EUR' },
    { code: 'QA', name: 'Qatar', currency: 'QAR' },
    { code: 'RO', name: 'Romania', currency: 'RON' },
    { code: 'RU', name: 'Russia', currency: 'RUB' },
    { code: 'RW', name: 'Rwanda', currency: 'RWF' },
    { code: 'KN', name: 'Saint Kitts and Nevis', currency: 'XCD' },
    { code: 'LC', name: 'Saint Lucia', currency: 'XCD' },
    { code: 'VC', name: 'Saint Vincent', currency: 'XCD' },
    { code: 'WS', name: 'Samoa', currency: 'WST' },
    { code: 'SM', name: 'San Marino', currency: 'EUR' },
    { code: 'ST', name: 'Sao Tome and Principe', currency: 'STN' },
    { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
    { code: 'SN', name: 'Senegal', currency: 'XOF' },
    { code: 'RS', name: 'Serbia', currency: 'RSD' },
    { code: 'SC', name: 'Seychelles', currency: 'SCR' },
    { code: 'SL', name: 'Sierra Leone', currency: 'SLE' },
    { code: 'SG', name: 'Singapore', currency: 'SGD' },
    { code: 'SK', name: 'Slovakia', currency: 'EUR' },
    { code: 'SI', name: 'Slovenia', currency: 'EUR' },
    { code: 'SB', name: 'Solomon Islands', currency: 'SBD' },
    { code: 'SO', name: 'Somalia', currency: 'SOS' },
    { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
    { code: 'SS', name: 'South Sudan', currency: 'SSP' },
    { code: 'ES', name: 'Spain', currency: 'EUR' },
    { code: 'LK', name: 'Sri Lanka', currency: 'LKR' },
    { code: 'SD', name: 'Sudan', currency: 'SDG' },
    { code: 'SR', name: 'Suriname', currency: 'SRD' },
    { code: 'SE', name: 'Sweden', currency: 'SEK' },
    { code: 'CH', name: 'Switzerland', currency: 'CHF' },
    { code: 'SY', name: 'Syria', currency: 'SYP' },
    { code: 'TW', name: 'Taiwan', currency: 'TWD' },
    { code: 'TJ', name: 'Tajikistan', currency: 'TJS' },
    { code: 'TZ', name: 'Tanzania', currency: 'TZS' },
    { code: 'TH', name: 'Thailand', currency: 'THB' },
    { code: 'TL', name: 'Timor-Leste', currency: 'USD' },
    { code: 'TG', name: 'Togo', currency: 'XOF' },
    { code: 'TO', name: 'Tonga', currency: 'TOP' },
    { code: 'TT', name: 'Trinidad and Tobago', currency: 'TTD' },
    { code: 'TN', name: 'Tunisia', currency: 'TND' },
    { code: 'TR', name: 'Turkey', currency: 'TRY' },
    { code: 'TM', name: 'Turkmenistan', currency: 'TMT' },
    { code: 'TV', name: 'Tuvalu', currency: 'AUD' },
    { code: 'UG', name: 'Uganda', currency: 'UGX' },
    { code: 'UA', name: 'Ukraine', currency: 'UAH' },
    { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
    { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'UY', name: 'Uruguay', currency: 'UYU' },
    { code: 'UZ', name: 'Uzbekistan', currency: 'UZS' },
    { code: 'VU', name: 'Vanuatu', currency: 'VUV' },
    { code: 'VE', name: 'Venezuela', currency: 'VES' },
    { code: 'VN', name: 'Vietnam', currency: 'VND' },
    { code: 'YE', name: 'Yemen', currency: 'YER' },
    { code: 'ZM', name: 'Zambia', currency: 'ZMW' },
    { code: 'ZW', name: 'Zimbabwe', currency: 'ZWL' }
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<string>('general');
    const [docTab, setDocTab] = useState('manual'); // manual | technical
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [showVideo, setShowVideo] = useState(false);

 const { theme, themeFamily, setTheme, setThemeFamily } = useTheme();

 // API State
    const [countries, setCountries] = useState<CountryConfig[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(true);

    // Initial Fetch
    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const res = await fetch('http://localhost:4000/countries');
            if (res.ok) {
                const data = await res.json();
                setCountries(data);
            }
        } catch (err) {
            console.error('Failed to fetch countries:', err);
        } finally {
            setLoadingCountries(false);
        }
    };

    const [newCountry, setNewCountry] = useState<Partial<CountryConfig>>({ countryLimit: 0, promoLimit: 0 });
    const [isAdding, setIsAdding] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        // Persist Settings
 localStorage.setItem('settings_countries', JSON.stringify(countries));

 setTimeout(() => {
            setIsSaving(false);
            setSuccessMsg('Settings updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        }, 800);
    };

 const handleThemeChange = (colorMode: 'light' | 'dark') => {
 setTheme(colorMode);
 };

 const handleThemeFamilyChange = (family: 'default' | 'ionix') => {
 setThemeFamily(family);
 };

    const handleCountrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCode = e.target.value;
        const countryData = AVAILABLE_COUNTRIES.find(c => c.code === selectedCode);

        if (countryData) {
            setNewCountry({
                ...newCountry,
                code: countryData.code,
                name: countryData.name,
                currency: countryData.currency
            });
        } else {
            setNewCountry({ ...newCountry, code: '', name: '', currency: '' });
        }
    };

    const handleAddCountry = () => {
        if (newCountry.code && newCountry.name && newCountry.currency) {
            setCountries([...countries, {
                code: newCountry.code.toUpperCase(),
                name: newCountry.name,
                currency: newCountry.currency.toUpperCase(),
                countryLimit: Number(newCountry.countryLimit) || 0,
                promoLimit: Number(newCountry.promoLimit) || 0
            }]);
            setNewCountry({ countryLimit: 0, promoLimit: 0, code: '', name: '', currency: '' });
            setIsAdding(false);
        }
    };

    const handleDeleteCountry = (code: string) => {
        if (confirm(`Are you sure you want to remove ${code}?`)) {
            setCountries(countries.filter(c => c.code !== code));
        }
    };

    const updateCountry = (code: string, field: keyof CountryConfig, value: any) => {
        setCountries(countries.map(c => c.code === code ? { ...c, [field]: value } : c));
    };

return (
<div className="settings-container settings-module ds-page-shell">
            <div className="page-header">
                <div>
                    <h1 className="page-title">System Settings</h1>
                    <p className="page-subtitle">Manage platform configurations, countries, and users.</p>
                </div>
            </div>

            {successMsg && (
                <div className="success-toast">
                    <CheckCircle2 size={16} /> {successMsg}
                </div>
            )}

            <div className="settings-layout">
                {/* Sidebar Navigation */}
                <div className="settings-nav ds-panel">
                    <button
                        className={`nav-btn ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <Settings size={18} /> General
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'system_status' ? 'active' : ''}`}
                        onClick={() => setActiveTab('system_status')}
                    >
                        <Activity size={18} /> System Health
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'simulator' ? 'active' : ''}`}
                        onClick={() => setActiveTab('simulator')}
                    >
                        <PlayCircle size={18} /> Event Simulator
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'countries' ? 'active' : ''}`}
                        onClick={() => setActiveTab('countries')}
                    >
                        <Globe size={18} /> Countries & Limits
                    </button>
 <button
 className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
 onClick={() => setActiveTab('users')}
 >
 <Users size={18} /> Users & Roles
 </button>
 <button
 className={`nav-btn ${activeTab === 'features' ? 'active' : ''}`}
 onClick={() => setActiveTab('features')}
 >
 <SlidersHorizontal size={18} /> Feature Configuration
 </button>
 <button
 className={`nav-btn ${activeTab === 'integrations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('integrations')}
                    >
                        <Webhook size={18} /> Integrations
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notifications')}
                    >
                        <Bell size={18} /> Notifications
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'support' ? 'active' : ''}`}
                        onClick={() => setActiveTab('support')}
                    >
                        <HelpCircle size={18} /> Support
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'documentation' ? 'active' : ''}`}
                        onClick={() => setActiveTab('documentation')}
                    >
                        <Book size={18} /> Documentation
                    </button>
                </div>

                {/* Content Area */}
                <div className="settings-content ds-panel">

                    {/* --- GENERAL TAB --- */}
                    {activeTab === 'general' && (
                        <div className="tab-pane">
                            <h3>General Configuration</h3>

                            {/* ... (Existing General Content) */}


 <div className="form-group mb-8">
 <label>Theme Family</label>
 <div className="theme-options">
 <button
 className={`theme-card ds-choice ${themeFamily === 'default' ? 'active is-selected' : ''}`}
 onClick={() => handleThemeFamilyChange('default')}
 >
 <Monitor size={24} />
 <span>Default</span>
 </button>
 <button
 className={`theme-card ds-choice ${themeFamily === 'ionix' ? 'active is-selected' : ''}`}
 onClick={() => handleThemeFamilyChange('ionix')}
 >
 <Sparkles size={24} />
 <span>Ionix Theme</span>
 </button>
 </div>
 </div>

 <div className="form-group mb-8">
 <label>Color Mode</label>
 <div className="theme-options">
 <button
 className={`theme-card ds-choice ${theme === 'light' ? 'active is-selected' : ''}`}
 onClick={() => handleThemeChange('light')}
 >
 <Sun size={24} />
 <span>Light Mode</span>
 </button>
 <button
 className={`theme-card ds-choice ${theme === 'dark' ? 'active is-selected' : ''}`}
 onClick={() => handleThemeChange('dark')}
 >
 <Moon size={24} />
 <span>Dark Mode</span>
 </button>
 </div>
 </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Platform Name</label>
                                    <input type="text" defaultValue="Betika Promotions Platform" />
                                </div>
                                <div className="form-group">
                                    <label>Default Currency</label>
                                    <select defaultValue="EUR">
                                        <option value="EUR">EUR (€)</option>
                                        <option value="USD">USD ($)</option>
                                    </select>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* --- SYSTEM STATUS TAB --- */}
                    {activeTab === 'system_status' && <SystemStatusTab />}

                    {/* --- SIMULATOR TAB --- */}
                    {activeTab === 'simulator' && <SimulatorTab />}

                    {/* --- COUNTRIES TAB --- */}
                    {activeTab === 'countries' && (
                        <div className="tab-pane">
                            <div className="pane-header">
                                <h3>Country Management</h3>
                                <button className="btn-secondary" onClick={() => setIsAdding(!isAdding)}>
                                    <Plus size={14} /> Add Country
                                </button>
                            </div>

                            {isAdding && (
                                <div className="add-country-form ds-card">
                                    <h4>Add New Country</h4>
                                    <div className="add-grid">
                                        {/* Progressive Dropdown */}
                                        <div className="form-group-flat">
                                            <select
                                                value={newCountry.code || ''}
                                                onChange={handleCountrySelect}
                                                className="full-select"
                                            >
                                                <option value="" disabled>Select Country...</option>
                                                {AVAILABLE_COUNTRIES.filter(ac => !countries.some(c => c.code === ac.code)).map(c => (
                                                    <option key={c.code} value={c.code}>
                                                        {getFlagEmoji(c.code)} {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Auto-populated Read-Only Fields */}
                                        <input
                                            placeholder="Code"
                                            value={newCountry.code || ''}
                                            readOnly
                                            className="input-readonly"
                                        />
                                        <input
                                            placeholder="Currency"
                                            value={newCountry.currency || ''}
                                            readOnly
                                            className="input-readonly"
                                        />

                                        {/* Editable Limits */}
                                        <input
                                            type="number"
                                            placeholder="Country Limit"
                                            value={newCountry.countryLimit || ''}
                                            onChange={e => setNewCountry({ ...newCountry, countryLimit: Number(e.target.value) })}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Promo Limit"
                                            value={newCountry.promoLimit || ''}
                                            onChange={e => setNewCountry({ ...newCountry, promoLimit: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button className="btn-cancel" onClick={() => setIsAdding(false)}>Cancel</button>
                                        <button className="btn-confirm" onClick={handleAddCountry} disabled={!newCountry.code}>Add Country</button>
                                    </div>
                                </div>
                            )}

                            <div className="countries-list">
                                <div className="list-header">
                                    <span>Country</span>
                                    <span>Code</span>
                                    <span>Currency</span>
                                    <span className="text-right">Market Cap</span>
                                    <span className="text-right">Promo Cap</span>
                                    <span>Actions</span>
                                </div>
                                {countries.map(country => (
                                    <div key={country.code} className="country-row key-row">
                                        <div className="font-medium">
                                            <span className="country-flag">{getFlagEmoji(country.code)}</span>
                                            {country.name}
                                        </div>
                                        <div className="badge-code">{country.code}</div>
                                        <div className="text-muted">{country.currency}</div>
                                        <div className="text-right">
                                            <input
                                                type="number"
                                                className="inline-input"
                                                value={country.countryLimit}
                                                onChange={(e) => updateCountry(country.code, 'countryLimit', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="text-right">
                                            <input
                                                type="number"
                                                className="inline-input"
                                                value={country.promoLimit}
                                                onChange={(e) => updateCountry(country.code, 'promoLimit', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <button className="btn-icon danger" onClick={() => handleDeleteCountry(country.code)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

{/* --- USERS & ROLES TAB --- */}
{activeTab === 'users' && (
<div className="tab-pane">
<UserManagementPanel />
</div>
)}

 {/* --- FEATURE CONFIGURATION TAB --- */}
 {activeTab === 'features' && (
 <div className="tab-pane">
 <FeatureConfigurationPanel onSaved={setSuccessMsg} />
 </div>
 )}

 {/* --- INTEGRATIONS TAB --- */}
 {activeTab === 'integrations' && (
                        <div className="tab-pane">
                            <h3>External Services</h3>
                            <div className="integrations-list">
                                {INTEGRATIONS.map(int => (
                                    <div key={int.id} className="integration-card">
                                        <div className="int-icon">{int.icon}</div>
                                        <div className="int-info">
                                            <h4>{int.name}</h4>
                                            <p className="status">
                                                <span className={`dot ${int.status}`}></span>
                                                {int.status === 'connected' ? 'Active Connection' : 'Not Configured'}
                                            </p>
                                        </div>
                                        <div className="int-actions">
                                            <button className="btn-configure">Configure</button>
                                            <label className="switch">
                                                <input type="checkbox" defaultChecked={int.status === 'connected'} />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- NOTIFICATIONS TAB --- */}
                    {activeTab === 'notifications' && (
                        <div className="tab-pane">
                            <h3>Alert Preferences</h3>
                            <div className="notif-group">
                                <div className="notif-item">
                                    <div className="notif-info">
                                        <h4>Campaign Budget Warning</h4>
                                        <p>Notify when a campaign reaches 80% of budget.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SUPPORT TAB --- */}
                    {activeTab === 'support' && (
                        <div className="tab-pane">
                            <h3>Help & Support Center</h3>
                            <p className="support-tab-intro">Need assistance? Log an issue, chat with our AI assistant, or configure support integrations.</p>
                            <SupportCenter />
                        </div>
                    )}

                    {/* --- DOCUMENTATION TAB --- */}
                    {activeTab === 'documentation' && (
                        <div className="tab-pane">
                            <div className="pane-header">
                                <h3>System Documentation</h3>
                                <div className="doc-tabs">
                                    <button
className="doc-tab-btn doc-tab-btn-about"
onClick={() => setShowVideo(true)}
                                    >
                                        <PlayCircle size={14} /> About Platform
                                    </button>
                                    <button
className={`doc-tab-btn doc-tab-btn-spaced ${docTab === 'faq' ? 'active' : ''}`}
onClick={() => setDocTab('faq')}
                                    >
                                        <HelpCircle size={14} /> FAQ
                                    </button>
                                    <button
className="doc-tab-btn doc-tab-btn-spaced"
onClick={() => window.dispatchEvent(new Event('restart-tour'))}
                                    >
                                        <CheckCircle2 size={14} /> Start Tour
                                    </button>
                                    <button
                                        className={`doc-tab-btn ${docTab === 'manual' ? 'active' : ''}`}
                                        onClick={() => setDocTab('manual')}
                                    >
                                        <Book size={14} /> User Manual
                                    </button>
                                    <button
                                        className={`doc-tab-btn ${docTab === 'technical' ? 'active' : ''}`}
                                        onClick={() => setDocTab('technical')}
                                    >
                                        <FileCode size={14} /> Technical Docs
                                    </button>
                                </div>
                            </div>

                            <div className="doc-content ds-card">
                                {docTab === 'manual' && (
                                    <div className="doc-section">
                                        <h4>📚 Betika Promotions Platform - User Manual v1.0</h4>
                                        <p>Complete guide to managing promotions and campaigns on the Betika Promotions Platform. This comprehensive manual includes step-by-step instructions, troubleshooting guides, and FAQ.</p>

                                        <div className="doc-link-list">
                                            <a
                                                href="/docs/Betika-Promotions-Platform_User_Manual_v1.0.pdf"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="doc-link"
                                            >
                                                <FileText size={16} />
                                                <div>
                                                    <span className="link-title">View User Manual PDF</span>
                                                    <span className="link-desc">Open the full user manual in your browser. 50+ pages covering all features from login to advanced tasks.</span>
                                                </div>
                                                <ExternalLink size={14} className="ext-icon" />
                                            </a>

                                            <a
                                                href="/docs/Betika-Promotions-Platform_User_Manual_v1.0.pdf"
                                                download="Betika-Promotions-Platform_User_Manual_v1.0.pdf"
                                                className="doc-link"
                                            >
                                                <FileText size={16} />
                                                <div>
                                                    <span className="link-title">Download User Manual</span>
                                                    <span className="link-desc">Download the PDF user manual for offline viewing and distribution to your team.</span>
                                                </div>
                                                <ExternalLink size={14} className="ext-icon" />
                                            </a>

                                            <a
                                                href="/docs/Betika_Support_Guide_v1.0.pdf"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="doc-link"
                                            >
                                                <HelpCircle size={16} />
                                                <div>
                                                    <span className="link-title">View Support Center Guide</span>
                                                    <span className="link-desc">Step-by-step guide to logging issues, tracking tickets, and using the AI assistant.</span>
                                                </div>
                                                <ExternalLink size={14} className="ext-icon" />
                                            </a>

                                            <a
                                                href="/docs/Betika_Support_Guide_v1.0.pdf"
                                                download="Betika_Support_Guide_v1.0.pdf"
                                                className="doc-link"
                                            >
                                                <HelpCircle size={16} />
                                                <div>
                                                    <span className="link-title">Download Support Guide</span>
                                                    <span className="link-desc">For offline reference.</span>
                                                </div>
                                                <ExternalLink size={14} className="ext-icon" />
                                            </a>
                                        </div>

<div className="help-box help-box-spaced">
<HelpCircle size={18} />
<p>Need more help? Contact support at <a href="mailto:support@betika.com" className="help-link">support@betika.com</a></p>
                                        </div>
                                    </div>
                                )}

                                {docTab === 'faq' && (
                                    <div className="doc-section">
                                        <h4>❓ Frequently Asked Questions</h4>
                                        <p>Quick answers to common questions about the Betika Promotions Platform.</p>

<div className="faq-list">
{/* General Questions */}
<div className="faq-card">
<h5>How do I create a new promotion?</h5>
<p>
                                                    Navigate to Promotions → Click "Create New Promotion" → Follow the 7-step wizard to configure your promotion details, eligibility rules, rewards, and schedule.
                                                </p>
                                            </div>

<div className="faq-card">
<h5>Can I edit a promotion after it&apos;s published?</h5>
<p>
                                                    Yes, but with limitations. You can edit the display messaging and extend the end date. Core rules like eligibility and rewards cannot be changed once live to maintain fairness.
                                                </p>
                                            </div>

<div className="faq-card">
<h5>How do budget limits work?</h5>
<p>
                                                    There are two types of limits: Country Limit (total cap for all promotions in a market) and Promotion Limit (cap for a single campaign). The system automatically stops awarding when limits are reached.
                                                </p>
                                            </div>

<div className="faq-card">
<h5>What&apos;s the difference between &quot;Active&quot; and &quot;Live&quot; status?</h5>
<p>
                                                    "Active" means the promotion is published and ready. "Live" means it's currently running (within the start/end date range). A promotion can be Active but not yet Live if the start date is in the future.
                                                </p>
                                            </div>

<div className="faq-card">
<h5>How do I preview how a promotion looks to customers?</h5>
<p>
                                                    In the Promotions list, click the three-dot menu (⋮) next to any promotion and select "Preview Customer View". This opens a simulation of how customers will see the promotion on the Betika platform.
                                                </p>
                                            </div>

<div className="faq-card">
<h5>Can I target specific user segments?</h5>
<p>
                                                    Yes! In Step 2 (Scope & Eligibility) of the wizard, you can define eligibility rules based on user attributes like registration date, activity level, location, and more.
                                                </p>
                                            </div>

<div className="faq-card">
<h5>What happens if I pause a promotion?</h5>
<p>
                                                    Pausing immediately stops new awards from being issued. The promotion disappears from customer-facing interfaces but existing awards remain valid. You can resume it anytime.
                                                </p>
                                            </div>

<div className="faq-card">
<h5>How do I download promotion performance data?</h5>
<p>
                                                    Click the "Export" button in the top-right of the Promotions list. You can export as CSV or Excel with filters for date range, status, and country.
                                                </p>
                                            </div>

<div className="faq-card">
<h5>Who can I contact for technical support?</h5>
<p>
Email <a href="mailto:support@betika.com" className="faq-link">support@betika.com</a> or use the in-app chat (bottom-right corner). For urgent issues, contact your account manager directly.
                                                </p>
                                            </div>
                                        </div>

<div className="help-box help-box-spaced">
<HelpCircle size={18} />
<p>Can&apos;t find your answer? Check the <span onClick={() => setDocTab('manual')} className="faq-manual-link">User Manual</span> or contact <a href="mailto:support@betika.com" className="help-link">support@betika.com</a></p>
                                        </div>
                                    </div>
                                )}

                                {docTab === 'technical' && (
                                    <div className="doc-section">
                                        <h4>API & Integration Specs</h4>
                                        <p>Technical details for integrating third-party services and data feeds.</p>

                                        <div className="code-snippet">
                                            <div className="snippet-header">POST /api/v1/promotions/validate</div>
                                            <pre>{`
{
  "promo_id": "PRO-2024-001",
  "player_id": "user_12345",
  "stake_amount": 50.00,
  "currency": "KES"
}
                                            `}</pre>
                                        </div>

                                        <div className="doc-link-list">
                                            <a href="#" className="doc-link">
                                                <Webhook size={16} />
                                                <div>
                                                    <span className="link-title">Webhooks Documentation</span>
                                                    <span className="link-desc">Events and payload structures for real-time updates.</span>
                                                </div>
                                                <ExternalLink size={14} className="ext-icon" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <ExplainerVideo isOpen={showVideo} onClose={() => setShowVideo(false)} />

 {/* --- GLOBAL SAVE BUTTON (Moved to Bottom) --- */}
          <div className="settings-footer">
            <div className="footer-spacer">
              <span className="footer-hint">Changes apply across all tabs when you save.</span>
            </div>
            <button
              className="btn-save"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
            </button>
          </div>


                </div>
            </div>
        </div >
    );
}
