import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Download,
  Settings,
  Radio,
  FileCode,
  Globe,
  Bell,
  Mail,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Copy,
  Terminal,
  Activity,
  Layers,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  AlertTriangle,
  Play,
  Eye
} from 'lucide-react';

interface AdItem {
  id: string;
  title: string;
  description: string;
  mediaType: string;
  mediaUrl: string;
  targetUrl: string;
  startDate: string;
  endDate: string;
  priority: number;
  active: boolean;
}

interface RemoteConfigState {
  announcement: {
    enabled: boolean;
    textAr: string;
    textEn: string;
    speed: number;
  };
  contact: {
    email: string;
    emailEnabled: boolean;
    whatsappNumber: string;
    whatsappCountryCode: string;
    whatsappEnabled: boolean;
  };
  features: {
    enableVideoAds: boolean;
    enableFloatingSpeedMeter: boolean;
    strictDnsSinkhole: boolean;
  };
}

interface VersionState {
  latestVersionCode: number;
  latestVersionName: string;
  minSupportedVersionCode: number;
  releaseNotesEn: string;
  releaseNotesAr: string;
  downloadUrl: string;
  sha256Checksum: string;
  isMandatory: boolean;
  publishedAt: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'ads' | 'announcements' | 'contacts' | 'versions' | 'termux'>('overview');
  const [config, setConfig] = useState<RemoteConfigState>({
    announcement: {
      enabled: true,
      textAr: "أهلاً بكم في تطبيق MTA Net blocker — جدار الحماية المحلي الأقوى لعزل التطبيقات ومنع تسريب بيانات الإنترنت محلياً بدون خوادم وسيطة.",
      textEn: "Welcome to MTA Net blocker — The zero-leak local firewall for per-app network isolation.",
      speed: 40
    },
    contact: {
      email: "hoaam100@gmail.com",
      emailEnabled: true,
      whatsappNumber: "739979559",
      whatsappCountryCode: "+967",
      whatsappEnabled: true
    },
    features: {
      enableVideoAds: true,
      enableFloatingSpeedMeter: true,
      strictDnsSinkhole: true
    }
  });
  const [ads, setAds] = useState<AdItem[]>([]);
  const [version, setVersion] = useState<VersionState>({
    latestVersionCode: 1,
    latestVersionName: "1.0.0",
    minSupportedVersionCode: 1,
    releaseNotesEn: "Initial production release of MTA Net blocker. Includes dual-stack IPv4/IPv6 packet filtering, real-time speed monitor, and remote configuration syncing.",
    releaseNotesAr: "الإطلاق الإنتاجي الأول لتطبيق MTA Net blocker. يتضمن التصفية المزدوجة لحزم IPv4/IPv6، ومراقب السرعة الحي، ومزامنة الإعلانات والتكوين عن بُعد.",
    downloadUrl: "https://github.com/mta-netblocker/releases/download/v1.0.0/mta-netblocker-v1.0.0-release.apk",
    sha256Checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    isMandatory: false,
    publishedAt: "2026-10-18T10:00:00Z"
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Phone Simulator State
  const [simScreen, setSimScreen] = useState<'splash' | 'main' | 'blocked' | 'ads'>('main');
  const [simLang, setSimLang] = useState<'en' | 'ar'>('en');
  const [simBlockAll, setSimBlockAll] = useState(false);
  const [simVpnActive, setSimVpnActive] = useState(true);
  const [simSearch, setSimSearch] = useState('');
  const [simFilter, setSimFilter] = useState<'all' | 'user' | 'system' | 'blocked'>('all');
  const [simShowUpdateDialog, setSimShowUpdateDialog] = useState(false);
  const [simShowEmergencyDialog, setSimShowEmergencyDialog] = useState(false);
  const [simDownloadRate, setSimDownloadRate] = useState('2.4 MB/s');
  const [simUploadRate, setSimUploadRate] = useState('180.5 KB/s');

  const [simApps, setSimApps] = useState([
    { pkg: 'com.google.android.youtube', name: 'YouTube', isSystem: true, isBlocked: false },
    { pkg: 'com.whatsapp', name: 'WhatsApp Messenger', isSystem: false, isBlocked: false },
    { pkg: 'com.facebook.katana', name: 'Facebook', isSystem: false, isBlocked: true },
    { pkg: 'com.instagram.android', name: 'Instagram', isSystem: false, isBlocked: true },
    { pkg: 'org.telegram.messenger', name: 'Telegram', isSystem: false, isBlocked: false },
    { pkg: 'com.google.android.gms', name: 'Google Play Services', isSystem: true, isBlocked: false },
    { pkg: 'com.android.chrome', name: 'Google Chrome', isSystem: true, isBlocked: false },
    { pkg: 'com.spotify.music', name: 'Spotify', isSystem: false, isBlocked: false },
    { pkg: 'com.tiktok.android', name: 'TikTok', isSystem: false, isBlocked: true },
    { pkg: 'com.snapchat.android', name: 'Snapchat', isSystem: false, isBlocked: false },
    { pkg: 'com.twitter.android', name: 'X (Twitter)', isSystem: false, isBlocked: true },
  ]);

  // Modals for Ads
  const [showNewAdModal, setShowNewAdModal] = useState(false);
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdDesc, setNewAdDesc] = useState('');
  const [newAdMediaUrl, setNewAdMediaUrl] = useState('');
  const [newAdMediaType, setNewAdMediaType] = useState('image');
  const [newAdTargetUrl, setNewAdTargetUrl] = useState('');
  const [newAdPriority, setNewAdPriority] = useState(5);

  // Admin Authentication State
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('mta_admin_token'));
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ initialized: boolean; authConfigured: boolean; configuredUsername: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
    checkAuthSession();
  }, []);

  async function checkAuthSession() {
    try {
      const statusRes = await fetch('/api/v1/auth/status').then(r => r.json());
      setAuthStatus(statusRes);

      const savedToken = localStorage.getItem('mta_admin_token');
      if (savedToken) {
        const meRes = await fetch('/api/v1/admin/me', {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setAdminUser(meData.user || 'Administrator');
          setAdminToken(savedToken);
        } else {
          localStorage.removeItem('mta_admin_token');
          setAdminToken(null);
          setAdminUser(null);
        }
      }
    } catch (e) {
      console.error("Failed checking auth session", e);
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/v1/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        localStorage.setItem('mta_admin_token', data.token);
        setAdminToken(data.token);
        setAdminUser(data.admin?.username || loginUsername || 'Administrator');
        setShowLoginModal(false);
        setLoginPassword('');
        setSaveStatus('Administrator authenticated successfully!');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setLoginError(data.error || 'Invalid administrator username or password');
      }
    } catch (err: any) {
      setLoginError('Authentication service unreachable: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mta_admin_token');
    setAdminToken(null);
    setAdminUser(null);
    setSaveStatus('Signed out of administrator session');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    return headers;
  };

  const handleDownloadZip = async () => {
    const token = localStorage.getItem('mta_admin_token');
    if (!token) {
      setLoginError('Please sign in as administrator before downloading the project.');
      setShowLoginModal(true);
      return;
    }

    try {
      const response = await fetch('/api/download-zip', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('mta_admin_token');
        setAdminToken(null);
        setAdminUser(null);
        setLoginError('Your administrator session has expired. Please sign in again.');
        setShowLoginModal(true);
        return;
      }

      if (!response.ok) {
        throw new Error(`Download failed (HTTP ${response.status})`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'mta-netblocker-production-project.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Project ZIP download failed:', error);
      setLoginError('Unable to download the project ZIP. Please try again.');
    }
  };

  // Simulate real-time speed fluctuation for interactive simulator
  useEffect(() => {
    const timer = setInterval(() => {
      if (!simVpnActive) {
        setSimDownloadRate('0.0 KB/s');
        setSimUploadRate('0.0 KB/s');
        return;
      }
      const dl = (Math.random() * 3.5 + 0.8).toFixed(1);
      const ul = (Math.random() * 450 + 50).toFixed(0);
      setSimDownloadRate(`${dl} MB/s`);
      setSimUploadRate(`${ul} KB/s`);
    }, 1500);
    return () => clearInterval(timer);
  }, [simVpnActive]);

  async function fetchInitialData() {
    try {
      setLoading(true);
      const [cfgRes, adsRes, verRes] = await Promise.all([
        fetch('/api/v1/config').then(r => r.json()),
        fetch('/api/v1/ads').then(r => r.json()),
        fetch('/api/v1/app-version').then(r => r.json())
      ]);
      setConfig(cfgRes);
      setAds(adsRes.ads || []);
      setVersion(verRes);
    } catch (e) {
      console.error("Failed to load initial data", e);
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleSaveAnnouncement = async () => {
    if (!config) return;
    try {
      const res = await fetch('/api/v1/admin/announcement', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(config.announcement)
      });
      if (res.ok) {
        setSaveStatus('Announcement updated successfully!');
        setTimeout(() => setSaveStatus(null), 3000);
      } else if (res.status === 401) {
        setShowLoginModal(true);
      }
    } catch (err) {
      alert('Failed to save announcement');
    }
  };

  const handleSaveContacts = async () => {
    if (!config) return;
    try {
      const res = await fetch('/api/v1/admin/contacts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(config.contact)
      });
      if (res.ok) {
        setSaveStatus('Contact settings updated successfully!');
        setTimeout(() => setSaveStatus(null), 3000);
      } else if (res.status === 401) {
        setShowLoginModal(true);
      }
    } catch (err) {
      alert('Failed to save contact settings');
    }
  };

  const handleSaveVersion = async () => {
    if (!version) return;
    try {
      const res = await fetch('/api/v1/admin/version', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(version)
      });
      if (res.ok) {
        setSaveStatus('App release version updated successfully!');
        setTimeout(() => setSaveStatus(null), 3000);
      } else if (res.status === 401) {
        setShowLoginModal(true);
      }
    } catch (err) {
      alert('Failed to save version release');
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: newAdTitle || 'Sponsored Announcement',
        description: newAdDesc,
        mediaType: newAdMediaType,
        mediaUrl: newAdMediaUrl || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
        targetUrl: newAdTargetUrl,
        priority: newAdPriority,
        active: true
      };
      const res = await fetch('/api/v1/admin/ads', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ad) {
        setAds([data.ad, ...ads]);
        setShowNewAdModal(false);
        setNewAdTitle('');
        setNewAdDesc('');
        setNewAdMediaUrl('');
      } else if (res.status === 401) {
        setShowLoginModal(true);
      }
    } catch (e) {
      alert('Failed to create advertisement');
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to remove this advertisement?')) return;
    const res = await fetch(`/api/v1/admin/ads/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      setAds(ads.filter(a => a.id !== id));
    } else if (res.status === 401) {
      setShowLoginModal(true);
    }
  };

  const handleToggleAdStatus = async (ad: AdItem) => {
    const updated = { ...ad, active: !ad.active };
    const res = await fetch(`/api/v1/admin/ads/${ad.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ active: updated.active })
    });
    if (res.ok) {
      setAds(ads.map(a => a.id === ad.id ? updated : a));
    } else if (res.status === 401) {
      setShowLoginModal(true);
    }
  };

  // Simulator app actions
  const toggleSimApp = (pkg: string) => {
    setSimApps(simApps.map(a => a.pkg === pkg ? { ...a, isBlocked: !a.isBlocked } : a));
  };

  const handleSimBlockAll = () => {
    setSimBlockAll(true);
    setSimApps(simApps.map(a => ({ ...a, isBlocked: true })));
  };

  const handleSimUnblockAll = () => {
    setSimBlockAll(false);
    setSimApps(simApps.map(a => ({ ...a, isBlocked: false })));
  };

  const simFilteredApps = simApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(simSearch.toLowerCase()) ||
      app.pkg.toLowerCase().includes(simSearch.toLowerCase());
    const matchesFilter =
      simFilter === 'all' ? true :
      simFilter === 'user' ? !app.isSystem :
      simFilter === 'system' ? app.isSystem :
      app.isBlocked;
    return matchesSearch && matchesFilter;
  });

  const simBlockedCount = simApps.filter(a => a.isBlocked).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Cyberpunk Neon Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.35)] relative overflow-hidden group">
              <Shield className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-cyan-400/10 animate-pulse pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg lg:text-xl font-extrabold tracking-tight text-white flex items-center">
                  MTA <span className="text-cyan-400 ml-1.5">Net blocker</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
                  v1.0.0 Prod
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                On-Device Local Firewall, Bandwidth Accounting &amp; Admin Console
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            {/* Admin Authentication Status Pill */}
            {adminUser ? (
              <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-mono font-medium hidden sm:inline">Admin: {adminUser}</span>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-300 font-medium pl-1 border-l border-slate-700 ml-1 text-[11px] cursor-pointer"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setLoginUsername(authStatus?.configuredUsername || '');
                  setShowLoginModal(true);
                }}
                className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadZip}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm shadow-[0_0_20px_rgba(0,229,255,0.25)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Download Full Project ZIP</span>
              <span className="sm:hidden">ZIP</span>
            </button>
          </div>
        </div>
      </header>

      {/* Save Notification Toast */}
      {saveStatus && (
        <div className="fixed top-18 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm shadow-xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Administrator Sign In</h3>
                  <p className="text-[11px] text-slate-400">Authenticate using MTA administrator credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Username or Email</label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  placeholder="e.g. hoaam100@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                🔒 Protected with cryptographic HMAC-SHA256 JWT tokens configured via MTA environment variables.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  {isLoggingIn ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Authenticate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="bg-slate-900/50 border-b border-slate-800/80 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex space-x-2 lg:space-x-6 overflow-x-auto py-2.5 scrollbar-none">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: Activity },
            { id: 'simulator', label: 'Live Android Simulator', icon: Smartphone },
            { id: 'ads', label: 'Ads Manager', icon: Layers },
            { id: 'announcements', label: 'Announcements (Ticker)', icon: Bell },
            { id: 'contacts', label: 'Contact Settings', icon: MessageSquare },
            { id: 'versions', label: 'Version & APK Release', icon: Sparkles },
            { id: 'termux', label: 'Termux & GitHub Guide', icon: Terminal },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 lg:p-8 flex-1">
        {/* ============================================================ */}
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {/* ============================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                  <span>FIREWALL ENGINE</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="mt-3 text-2xl font-black text-white">VpnService TUN</div>
                <div className="mt-1 text-xs text-slate-400">Zero-leak IPv4/IPv6 on-device drop</div>
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl" />
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                  <span>SPEED MONITOR</span>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="mt-3 text-2xl font-black text-cyan-400">1s Interval</div>
                <div className="mt-1 text-xs text-slate-400">TrafficStats + TUN Accounting</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                  <span>ACTIVE ADS</span>
                  <Layers className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-3 text-2xl font-black text-white">{ads.filter(a => a.active).length} Campaigns</div>
                <div className="mt-1 text-xs text-slate-400">Images &amp; Videos (ExoPlayer)</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                  <span>LATEST RELEASE</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-3 text-2xl font-black text-amber-400">v{version?.latestVersionName || '1.0.0'}</div>
                <div className="mt-1 text-xs font-mono text-slate-400 truncate">SHA-256 Verified</div>
              </div>
            </div>

            {/* Authentication Status Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 lg:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">Administrator Authentication</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Configured &amp; Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Credentials initialized from environment variables (<code className="text-cyan-300 font-mono">MTA_ADMIN_USERNAME</code>, <code className="text-cyan-300 font-mono">MTA_ADMIN_PASSWORD</code>, <code className="text-cyan-300 font-mono">MTA_JWT_SECRET</code>)
                  </p>
                </div>
              </div>

              <div>
                {adminUser ? (
                  <div className="flex items-center space-x-2 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold">Active Session: {adminUser}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setLoginUsername(authStatus?.configuredUsername || '');
                      setShowLoginModal(true);
                    }}
                    className="inline-flex items-center space-x-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In to Admin Session</span>
                  </button>
                )}
              </div>
            </div>

            {/* Project Quick Overview Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/20 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Real On-Device Android Firewall &amp; Speed Engine</span>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-white">
                  MTA Net blocker Android Source Ready for Termux &amp; GitHub
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  The Android Studio project has been engineered with Kotlin, Jetpack Compose, Room/DataStore, Media3 ExoPlayer, and native <code className="text-cyan-300 font-mono">VpnService</code> local packet filtering. Download the complete ZIP archive to inspect in Termux, push to GitHub, or build the APK via the included GitHub Actions workflow.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  className="flex items-center justify-center space-x-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download ZIP Archive</span>
                </button>
                <button
                  onClick={() => setActiveTab('simulator')}
                  className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-5 py-3 rounded-xl text-sm border border-slate-700 transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Test Live Simulator</span>
                </button>
              </div>
            </div>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                  1
                </div>
                <h3 className="text-base font-bold text-white">Zero Remote Proxies</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unlike commercial VPN apps that stream device packets to third-party data centers, MTA Net blocker isolates apps locally inside Android's kernel TUN file descriptor. Unblocked applications stream at native hardware speeds with 0ms tunnel lag.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  2
                </div>
                <h3 className="text-base font-bold text-white">Dual-Stack IPv4 &amp; IPv6</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Prevents sneaky IPv6 network leaks. Binds <code className="text-cyan-300">10.0.0.2/32</code> and <code className="text-cyan-300">fd00::2/128</code> with local DNS sinkholes (<code className="text-cyan-300">10.0.0.1</code> &amp; <code className="text-cyan-300">fd00::1</code>) to null-route rogue background packets.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  3
                </div>
                <h3 className="text-base font-bold text-white">Live Speed Accounting</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time download and upload rate calculations computed every second. Distinguishes device-wide hardware traffic (<code className="text-cyan-300">TrafficStats</code>) from VPN interface bandwidth. Includes persistent notification &amp; floating screen overlay.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: INTERACTIVE LIVE ANDROID SIMULATOR */}
        {/* ============================================================ */}
        {activeTab === 'simulator' && (
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
            {/* Phone Controls Column */}
            <div className="w-full lg:w-80 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400 flex items-center">
                  <Smartphone className="w-4 h-4 mr-2 text-cyan-400" />
                  Simulator Controls
                </h3>

                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Layout Language</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSimLang('en')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        simLang === 'en' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      English (LTR)
                    </button>
                    <button
                      onClick={() => setSimLang('ar')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        simLang === 'ar' ? 'bg-cyan-500 text-slate-950 font-cairo' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      العربية (RTL)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Screen Navigation</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSimScreen('main')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        simScreen === 'main' ? 'bg-slate-700 text-white border border-cyan-400/40' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Firewall Main
                    </button>
                    <button
                      onClick={() => setSimScreen('blocked')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        simScreen === 'blocked' ? 'bg-slate-700 text-white border border-cyan-400/40' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Blocked Apps ({simBlockedCount})
                    </button>
                    <button
                      onClick={() => setSimScreen('ads')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        simScreen === 'ads' ? 'bg-slate-700 text-white border border-cyan-400/40' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Ads &amp; Contact
                    </button>
                    <button
                      onClick={() => {
                        setSimScreen('splash');
                        setTimeout(() => setSimScreen('main'), 2500);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-cyan-400 hover:bg-slate-700 cursor-pointer"
                    >
                      Re-run Splash (3s)
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">VpnService State</span>
                    <button
                      onClick={() => setSimVpnActive(!simVpnActive)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                        simVpnActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {simVpnActive ? 'ACTIVE' : 'PAUSED'}
                    </button>
                  </div>

                  <button
                    onClick={() => setSimShowUpdateDialog(true)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/20 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Simulate In-App Update Prompt
                  </button>
                </div>
              </div>
            </div>

            {/* Virtual Android Phone Frame */}
            <div className="relative w-full max-w-[390px] h-[780px] bg-slate-950 border-[10px] border-slate-800 rounded-[50px] shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
              {/* Speaker & Camera Notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 flex items-center justify-center z-50 rounded-b-2xl mx-24">
                <div className="w-12 h-3.5 bg-slate-950 rounded-full flex items-center justify-end px-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-900/60" />
                </div>
              </div>

              {/* Status Bar */}
              <div className="h-9 px-6 pt-2 flex items-center justify-between text-[11px] text-slate-300 font-mono z-40 bg-slate-950 select-none">
                <span>04:45</span>
                <div className="flex items-center space-x-1.5">
                  {simVpnActive && <Lock className="w-3 h-3 text-cyan-400" />}
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Phone Content Canvas with RTL/LTR Support */}
              <div
                dir={simLang === 'ar' ? 'rtl' : 'ltr'}
                className="flex-1 overflow-y-auto bg-slate-950 text-white flex flex-col font-sans select-none scrollbar-none"
              >
                {/* SPLASH SCREEN */}
                {simScreen === 'splash' && (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fadeIn">
                    <div className="w-28 h-28 rounded-3xl bg-slate-900 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_35px_rgba(0,229,255,0.4)] relative">
                      <Shield className="w-14 h-14 text-cyan-400" />
                      <div className="w-8 h-8 rounded-full border-2 border-rose-500 absolute" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-wider text-white">MTA Net blocker</h2>
                      <p className="text-xs text-cyan-400 font-semibold mt-1">
                        {simLang === 'ar' ? 'إنترنتك.. تحت سيطرتك الكاملة' : 'Your Internet. Your Control.'}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 max-w-xs">
                      {simLang === 'ar'
                        ? 'جدار ناري محلي فائق الأمان لمنع تسريب البيانات وعزل التطبيقات'
                        : 'Zero-leak on-device network firewall & privacy engine'}
                    </p>
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mt-4" />
                  </div>
                )}

                {/* MAIN FIREWALL SCREEN */}
                {simScreen === 'main' && (
                  <div className="flex-1 flex flex-col p-3 space-y-3">
                    {/* Live Speed Bar */}
                    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3 shadow-lg">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                          <div className={`w-2 h-2 rounded-full ${simVpnActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                          <span className={`font-bold text-[11px] ${simBlockAll ? 'text-rose-400' : simVpnActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                            {simBlockAll
                              ? (simLang === 'ar' ? 'حظر شامل للشبكة' : 'GLOBAL LOCKDOWN')
                              : simVpnActive
                              ? (simLang === 'ar' ? 'الجدار الناري نشط' : 'Firewall Active • Filtering')
                              : (simLang === 'ar' ? 'الجدار الناري متوقف' : 'Firewall Paused')}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400/80">1s Live</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                            <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">{simLang === 'ar' ? 'التنزيل' : 'Download'}</div>
                            <div className="font-mono font-bold text-white text-xs">{simDownloadRate}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">{simLang === 'ar' ? 'الرفع' : 'Upload'}</div>
                            <div className="font-mono font-bold text-white text-xs">{simUploadRate}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Master Actions (Block All, Unblock All, Blocked List) */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={handleSimBlockAll}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-all ${
                          simBlockAll ? 'bg-rose-500 text-white' : 'bg-slate-900 border border-slate-800 text-rose-400 hover:bg-slate-800'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5 mb-0.5" />
                        <span>{simLang === 'ar' ? 'حظر الكل' : 'Block All'}</span>
                      </button>

                      <button
                        onClick={handleSimUnblockAll}
                        className="py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800 transition-all"
                      >
                        <Unlock className="w-3.5 h-3.5 mb-0.5" />
                        <span>{simLang === 'ar' ? 'فك الحظر' : 'Unblock All'}</span>
                      </button>

                      <button
                        onClick={() => setSimScreen('blocked')}
                        className="py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 transition-all"
                      >
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black">{simBlockedCount}</span>
                        </div>
                        <span>{simLang === 'ar' ? 'المحظورة' : 'Blocked'}</span>
                      </button>
                    </div>

                    {/* Search & Filter */}
                    <div className="space-y-1.5">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute top-2.5 left-2.5 text-slate-400 rtl:left-auto rtl:right-2.5" />
                        <input
                          type="text"
                          value={simSearch}
                          onChange={e => setSimSearch(e.target.value)}
                          placeholder={simLang === 'ar' ? 'البحث في التطبيقات...' : 'Search installed apps...'}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="flex space-x-1.5 rtl:space-x-reverse overflow-x-auto text-[10px] scrollbar-none py-0.5">
                        {[
                          { id: 'all', label: simLang === 'ar' ? 'الكل' : 'All' },
                          { id: 'user', label: simLang === 'ar' ? 'المستخدم' : 'User' },
                          { id: 'system', label: simLang === 'ar' ? 'النظام' : 'System' },
                          { id: 'blocked', label: simLang === 'ar' ? `المحظورة (${simBlockedCount})` : `Blocked (${simBlockedCount})` },
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setSimFilter(f.id as any)}
                            className={`px-2 py-0.5 rounded-full whitespace-nowrap ${
                              simFilter === f.id
                                ? 'bg-cyan-500 text-slate-950 font-bold'
                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* App List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {simFilteredApps.map(app => (
                        <div
                          key={app.pkg}
                          className={`p-2.5 rounded-xl bg-slate-900/80 border transition-all flex items-center justify-between ${
                            app.isBlocked ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 rtl:space-x-reverse truncate">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              app.isBlocked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-cyan-400'
                            }`}>
                              {app.name.charAt(0)}
                            </div>
                            <div className="truncate">
                              <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                                <span className="text-xs font-semibold text-white truncate">{app.name}</span>
                                {app.isSystem && (
                                  <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded">SYS</span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 truncate">{app.pkg}</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 rtl:space-x-reverse shrink-0">
                            <span className={`text-[10px] font-bold ${app.isBlocked ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {app.isBlocked ? (simLang === 'ar' ? 'محظور' : 'BLOCKED') : (simLang === 'ar' ? 'مسموح' : 'ALLOWED')}
                            </span>
                            <button
                              onClick={() => toggleSimApp(app.pkg)}
                              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                                app.isBlocked ? 'bg-rose-500' : 'bg-slate-800'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                app.isBlocked ? 'transform translate-x-4 rtl:-translate-x-4' : ''
                              }`} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BLOCKED APPS SCREEN */}
                {simScreen === 'blocked' && (
                  <div className="flex-1 flex flex-col p-3 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => setSimScreen('main')}
                          className="text-xs text-cyan-400 font-semibold"
                        >
                          ← {simLang === 'ar' ? 'رجوع' : 'Back'}
                        </button>
                        <h3 className="text-sm font-bold text-white">
                          {simLang === 'ar' ? 'التطبيقات المحظورة' : 'Blocked Applications'} ({simBlockedCount})
                        </h3>
                      </div>
                      {simBlockedCount > 0 && (
                        <button
                          onClick={handleSimUnblockAll}
                          className="text-[11px] font-bold text-emerald-400 hover:underline"
                        >
                          {simLang === 'ar' ? 'إلغاء حظر الكل' : 'Unblock All'}
                        </button>
                      )}
                    </div>

                    {simBlockedCount === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        <div className="text-sm font-bold text-white">{simLang === 'ar' ? 'لا توجد تطبيقات محظورة' : 'No Blocked Applications'}</div>
                        <div className="text-xs">{simLang === 'ar' ? 'جميع التطبيقات تتصل بالإنترنت حالياً' : 'All applications currently have direct network access.'}</div>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-2">
                        {simApps.filter(a => a.isBlocked).map(app => (
                          <div key={app.pkg} className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/30 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-white">{app.name}</div>
                              <div className="text-[10px] font-mono text-slate-400">{app.pkg}</div>
                            </div>
                            <button
                              onClick={() => toggleSimApp(app.pkg)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-bold hover:bg-slate-700"
                            >
                              {simLang === 'ar' ? 'فك الحظر' : 'Unblock'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ADS & CONTACT SCREEN */}
                {simScreen === 'ads' && (
                  <div className="flex-1 flex flex-col">
                    {/* Upper 50% Section: Advertisement Display */}
                    <div className="h-1/2 relative bg-slate-900 overflow-hidden border-b border-slate-800 group">
                      {ads[0] ? (
                        <>
                          <img
                            src={ads[0].mediaUrl}
                            alt={ads[0].title}
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-end">
                            <span className="self-start px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-400 text-slate-950 mb-1">
                              {ads[0].mediaType.toUpperCase()} AD
                            </span>
                            <h4 className="text-sm font-bold text-white">{ads[0].title}</h4>
                            <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">{ads[0].description}</p>
                            {ads[0].targetUrl && (
                              <a
                                href={ads[0].targetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-[10px] font-bold text-cyan-400 mt-1.5"
                              >
                                <span>Learn More</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-slate-500">
                          No Active Ads
                        </div>
                      )}
                    </div>

                    {/* Lower Section: Announcement Ticker & Contact Buttons */}
                    <div className="h-1/2 p-3 flex flex-col justify-between bg-slate-950">
                      {/* Ticker banner */}
                      {config?.announcement.enabled && (
                        <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-2 flex items-center space-x-2 rtl:space-x-reverse overflow-hidden">
                          <Bell className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <div className="overflow-hidden whitespace-nowrap text-xs text-cyan-200 animate-marquee">
                            <span>📢 {simLang === 'ar' ? config.announcement.textAr : config.announcement.textEn}</span>
                          </div>
                        </div>
                      )}

                      {/* Contact Inquiries Box */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                        <div className="text-center">
                          <h5 className="text-xs font-bold text-white">
                            {simLang === 'ar' ? 'الإعلانات والتواصل المباشر' : 'Advertising & Sponsorship'}
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {simLang === 'ar' ? 'تواصل معنا لحجز مساحات إعلانية متميزة' : 'Direct inquiries for verified sponsor placement'}
                          </p>
                        </div>

                        {/* Email Button */}
                        {config?.contact.emailEnabled && (
                          <a
                            href={`mailto:${config.contact.email}?subject=MTA%20Net%20Blocker%20Inquiry`}
                            className="w-full py-2 px-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-cyan-400 flex items-center justify-center space-x-2 text-xs text-white font-medium"
                          >
                            <Mail className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="truncate">{config.contact.email}</span>
                          </a>
                        )}

                        {/* WhatsApp Button */}
                        {config?.contact.whatsappEnabled && (
                          <a
                            href={`https://wa.me/${config.contact.whatsappCountryCode.replace('+', '')}${config.contact.whatsappNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 px-3 rounded-lg bg-[#075E54] hover:bg-[#128C7E] flex items-center justify-center space-x-2 text-xs text-white font-bold"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp ({config.contact.whatsappCountryCode} {config.contact.whatsappNumber})</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Navigation Bar */}
              <div
                dir={simLang === 'ar' ? 'rtl' : 'ltr'}
                className="h-14 bg-slate-900 border-t border-slate-800/80 px-4 flex items-center justify-around z-40 select-none"
              >
                <button
                  onClick={() => setSimScreen('main')}
                  className={`flex flex-col items-center space-y-0.5 cursor-pointer ${
                    simScreen === 'main' ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="text-[10px] font-semibold">{simLang === 'ar' ? 'الجدار الناري' : 'Firewall'}</span>
                </button>

                <button
                  onClick={() => setSimScreen('blocked')}
                  className={`flex flex-col items-center space-y-0.5 cursor-pointer ${
                    simScreen === 'blocked' ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-[10px] font-semibold">{simLang === 'ar' ? 'المحظورة' : 'Blocked'}</span>
                </button>

                <button
                  onClick={() => setSimScreen('ads')}
                  className={`flex flex-col items-center space-y-0.5 cursor-pointer ${
                    simScreen === 'ads' ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span className="text-[10px] font-semibold">{simLang === 'ar' ? 'الإعلانات' : 'Ads & Contact'}</span>
                </button>
              </div>

              {/* Update Prompt Overlay Simulation */}
              {simShowUpdateDialog && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 p-6 flex items-center justify-center">
                  <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 text-center space-y-3 w-full shadow-2xl">
                    <Sparkles className="w-8 h-8 text-cyan-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">Update Available: v1.0.0</h4>
                    <p className="text-xs text-slate-300">
                      {version?.releaseNotesEn || 'Production release with dual-stack packet filter.'}
                    </p>
                    <div className="bg-slate-950 p-2 rounded text-[9px] font-mono text-cyan-400 truncate">
                      SHA-256: {version?.sha256Checksum?.substring(0, 24)}...
                    </div>
                    <div className="flex space-x-2 pt-1">
                      <button
                        onClick={() => setSimShowUpdateDialog(false)}
                        className="flex-1 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg"
                      >
                        Later
                      </button>
                      <button
                        onClick={() => {
                          alert('Downloading APK & verifying cryptographic SHA-256 checksum...');
                          setSimShowUpdateDialog(false);
                        }}
                        className="flex-1 py-1.5 bg-cyan-500 text-xs font-bold text-slate-950 rounded-lg"
                      >
                        Download APK
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: ADS MANAGER */}
        {/* ============================================================ */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Advertisement Campaigns</h2>
                <p className="text-xs text-slate-400">Manage remote media display (Image/Video) pushed to Android clients</p>
              </div>
              <button
                onClick={() => setShowNewAdModal(true)}
                className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Ad</span>
              </button>
            </div>

            {/* Ads Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map(ad => (
                <div key={ad.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                  <div className="h-44 relative bg-slate-950 overflow-hidden">
                    <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 flex space-x-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 text-cyan-400 border border-cyan-500/30">
                        {ad.mediaType.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ad.active ? 'bg-emerald-500/90 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {ad.active ? 'ACTIVE' : 'DRAFT'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-white text-sm">{ad.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ad.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleAdStatus(ad)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          ad.active ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        }`}
                      >
                        {ad.active ? 'Unpublish' : 'Publish'}
                      </button>

                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Create Ad Modal */}
            {showNewAdModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
                  <h3 className="text-base font-bold text-white">Create New Remote Advertisement</h3>
                  <form onSubmit={handleCreateAd} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Campaign Title</label>
                      <input
                        type="text"
                        required
                        value={newAdTitle}
                        onChange={e => setNewAdTitle(e.target.value)}
                        placeholder="e.g. MTA Pro Security"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={newAdDesc}
                        onChange={e => setNewAdDesc(e.target.value)}
                        placeholder="Brief campaign pitch..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Media Type</label>
                        <select
                          value={newAdMediaType}
                          onChange={e => setNewAdMediaType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                        >
                          <option value="image">Image</option>
                          <option value="video">Video (ExoPlayer)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Display Priority</label>
                        <input
                          type="number"
                          value={newAdPriority}
                          onChange={e => setNewAdPriority(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Media URL (HTTPS)</label>
                      <input
                        type="url"
                        value={newAdMediaUrl}
                        onChange={e => setNewAdMediaUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Target Click URL</label>
                      <input
                        type="url"
                        value={newAdTargetUrl}
                        onChange={e => setNewAdTargetUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewAdModal(false)}
                        className="px-4 py-2 bg-slate-800 rounded-xl text-xs text-slate-300 font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-cyan-500 rounded-xl text-xs font-bold text-slate-950 cursor-pointer"
                      >
                        Save &amp; Publish
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: ANNOUNCEMENTS (TICKER) */}
        {/* ============================================================ */}
        {activeTab === 'announcements' && config && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Scrolling Announcement Ticker</h2>
              <p className="text-xs text-slate-400">Configure horizontal marquee announcement displayed on the Android client</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-sm font-semibold text-white">Enable Scrolling Ticker</span>
                <input
                  type="checkbox"
                  checked={config.announcement.enabled}
                  onChange={e => setConfig({
                    ...config,
                    announcement: { ...config.announcement, enabled: e.target.checked }
                  })}
                  className="w-5 h-5 accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                  Arabic Text (النص العربي مع دعم اتجاه RTL الكامل)
                </label>
                <textarea
                  dir="rtl"
                  rows={3}
                  value={config.announcement.textAr}
                  onChange={e => setConfig({
                    ...config,
                    announcement: { ...config.announcement, textAr: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white font-cairo focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">English Text (LTR)</label>
                <textarea
                  rows={2}
                  value={config.announcement.textEn}
                  onChange={e => setConfig({
                    ...config,
                    announcement: { ...config.announcement, textEn: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                <span className="text-xs text-slate-400 font-mono">LIVE PREVIEW</span>
                <div className="overflow-hidden whitespace-nowrap bg-slate-900 p-2.5 rounded-lg border border-cyan-500/30 text-cyan-300 text-xs">
                  📢 {config.announcement.textAr} • {config.announcement.textEn}
                </div>
              </div>

              <button
                onClick={handleSaveAnnouncement}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.2)]"
              >
                Save Announcement Configuration
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: CONTACT SETTINGS */}
        {/* ============================================================ */}
        {activeTab === 'contacts' && config && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Contact &amp; Inquiries Configuration</h2>
              <p className="text-xs text-slate-400">Configure email and international WhatsApp inquiries dynamically</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              {/* Email Section */}
              <div className="space-y-3 pb-5 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-cyan-400" />
                    Advertising Email Inquiries
                  </span>
                  <input
                    type="checkbox"
                    checked={config.contact.emailEnabled}
                    onChange={e => setConfig({
                      ...config,
                      contact: { ...config.contact, emailEnabled: e.target.checked }
                    })}
                    className="w-5 h-5 accent-cyan-400 cursor-pointer"
                  />
                </div>
                <input
                  type="email"
                  value={config.contact.email}
                  onChange={e => setConfig({
                    ...config,
                    contact: { ...config.contact, email: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white"
                />
              </div>

              {/* WhatsApp Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2 text-emerald-400" />
                    WhatsApp Inquiries
                  </span>
                  <input
                    type="checkbox"
                    checked={config.contact.whatsappEnabled}
                    onChange={e => setConfig({
                      ...config,
                      contact: { ...config.contact, whatsappEnabled: e.target.checked }
                    })}
                    className="w-5 h-5 accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Country Calling Code</label>
                    <select
                      value={config.contact.whatsappCountryCode}
                      onChange={e => setConfig({
                        ...config,
                        contact: { ...config.contact, whatsappCountryCode: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white"
                    >
                      <option value="+967">+967 (Yemen)</option>
                      <option value="+966">+966 (Saudi Arabia)</option>
                      <option value="+20">+20 (Egypt)</option>
                      <option value="+971">+971 (UAE)</option>
                      <option value="+965">+965 (Kuwait)</option>
                      <option value="+968">+968 (Oman)</option>
                      <option value="+974">+974 (Qatar)</option>
                      <option value="+962">+962 (Jordan)</option>
                      <option value="+1">+1 (USA / Canada)</option>
                      <option value="+44">+44 (UK)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Local Phone Number</label>
                    <input
                      type="text"
                      value={config.contact.whatsappNumber}
                      onChange={e => setConfig({
                        ...config,
                        contact: { ...config.contact, whatsappNumber: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Generated WhatsApp Link:</span>
                  <a
                    href={`https://wa.me/${config.contact.whatsappCountryCode.replace('+', '')}${config.contact.whatsappNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 font-mono font-semibold hover:underline flex items-center space-x-1"
                  >
                    <span>https://wa.me/{config.contact.whatsappCountryCode.replace('+', '')}{config.contact.whatsappNumber}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <button
                onClick={handleSaveContacts}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.2)]"
              >
                Save Contact Settings
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: VERSION & APK RELEASE */}
        {/* ============================================================ */}
        {activeTab === 'versions' && version && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Application Version &amp; APK Release</h2>
              <p className="text-xs text-slate-400">Manage in-app software update endpoints and cryptographic SHA-256 integrity hashes</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Latest Version Name</label>
                  <input
                    type="text"
                    value={version.latestVersionName}
                    onChange={e => setVersion({ ...version, latestVersionName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Version Code (Integer)</label>
                  <input
                    type="number"
                    value={version.latestVersionCode}
                    onChange={e => setVersion({ ...version, latestVersionCode: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">APK Download URL (HTTPS)</label>
                <input
                  type="url"
                  value={version.downloadUrl}
                  onChange={e => setVersion({ ...version, downloadUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">APK SHA-256 Checksum (Hexadecimal)</label>
                <input
                  type="text"
                  value={version.sha256Checksum}
                  onChange={e => setVersion({ ...version, sha256Checksum: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-cyan-300 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Calculated via: <code className="text-cyan-400">sha256sum app-release.apk</code></p>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Release Notes (English)</label>
                <textarea
                  rows={2}
                  value={version.releaseNotesEn}
                  onChange={e => setVersion({ ...version, releaseNotesEn: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Release Notes (Arabic)</label>
                <textarea
                  dir="rtl"
                  rows={2}
                  value={version.releaseNotesAr}
                  onChange={e => setVersion({ ...version, releaseNotesAr: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-white font-cairo"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="mandatory"
                  checked={version.isMandatory}
                  onChange={e => setVersion({ ...version, isMandatory: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
                <label htmlFor="mandatory" className="text-xs text-slate-300 cursor-pointer">
                  Mandatory Update (Forces user to install before continuing)
                </label>
              </div>

              <button
                onClick={handleSaveVersion}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.2)]"
              >
                Publish New App Release Metadata
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 7: TERMUX & GITHUB GUIDE */}
        {/* ============================================================ */}
        {activeTab === 'termux' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Termux Android &amp; GitHub Setup Guide</h2>
              <p className="text-xs text-slate-400">Step-by-step instructions to extract, inspect, and push to GitHub directly from your Android phone</p>
            </div>

            {/* Step 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">STEP 1: INSTALL TERMUX PACKAGES</span>
                <button
                  onClick={() => copyToClipboard('pkg update && pkg install -y git openjdk-17 unzip curl', 'step1')}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCmd === 'step1' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto">
                pkg update && pkg install -y git openjdk-17 unzip curl
              </pre>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">STEP 2: EXTRACT IN DEDICATED DIRECTORY</span>
                <button
                  onClick={() => copyToClipboard('termux-setup-storage && mkdir -p ~/mta-netblocker && cd ~/mta-netblocker && unzip /sdcard/Download/mta-netblocker-production-project.zip -d .', 'step2')}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCmd === 'step2' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto">
{`termux-setup-storage
mkdir -p ~/mta-netblocker && cd ~/mta-netblocker
unzip /sdcard/Download/mta-netblocker-production-project.zip -d .`}
              </pre>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">STEP 3: INITIALIZE GIT &amp; PUSH TO GITHUB</span>
                <button
                  onClick={() => copyToClipboard('git init && git add . && git commit -m "feat: initial commit of MTA Net blocker" && git branch -M main', 'step3')}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCmd === 'step3' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto">
{`git init
git add .
git commit -m "feat: initial commit of MTA Net blocker"
git branch -M main
git remote add origin https://github.com/<YOUR_USER>/mta-netblocker.git
git push -u origin main`}
              </pre>
              <p className="text-xs text-slate-400">
                ✨ Once pushed, GitHub Actions automatically builds the APK and uploads it to GitHub Artifacts!
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
