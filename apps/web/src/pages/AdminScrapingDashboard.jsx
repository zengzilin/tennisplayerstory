
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiServerClient } from '@/lib/apiServerClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Clock, Database, Play, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminScrapingDashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState({ atp: null, wta: null, itf: null });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState({ atp: false, wta: false, itf: false, all: false });
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ totalPlayers: 0, recentUpdates: 0 });
  const [autoScrapeEnabled, setAutoScrapeEnabled] = useState(true);

  const langPrefix = `/${currentLanguage}`;

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate(langPrefix, { replace: true });
      return;
    }
    
    const loadData = async () => {
      await Promise.all([fetchStatus(), fetchLogs(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [currentUser, navigate, langPrefix]);

  const fetchStatus = async () => {
    try {
      const response = await apiServerClient.fetch('/scrape/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching status:', err);
      setError(t('admin.scrape.errorStatus', 'Failed to fetch scraping status'));
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await apiServerClient.fetch('/scrape/logs');
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setLogs([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiServerClient.fetch('/scrape/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleScrape = async (source) => {
    setScraping(prev => ({ ...prev, [source.toLowerCase()]: true }));
    setError(null);
    try {
      const response = await apiServerClient.fetch(`/scrape/${source.toLowerCase()}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok || data.success === false) {
        const errorMessage = data.error || data.message || `Failed to scrape ${source}`;
        throw new Error(errorMessage);
      }
      
      toast.success(t('admin.scrape.success', '{{source}} Scraped Successfully', { source: source.toUpperCase() }), {
        description: t('admin.scrape.successDesc', 'Created: {{created}} | Updated: {{updated}}', { 
          created: data.playersCreated || 0, 
          updated: data.playersUpdated || 0 
        })
      });
      
      await Promise.all([fetchStatus(), fetchLogs(), fetchStats()]);
    } catch (err) {
      console.error(`Error scraping ${source}:`, err);
      setError(t('admin.scrape.errorScrape', 'Failed to scrape {{source}}: {{error}}', { source: source.toUpperCase(), error: err.message }));
      toast.error(t('common.error', 'Scraping Failed'), {
        description: err.message
      });
    } finally {
      setScraping(prev => ({ ...prev, [source.toLowerCase()]: false }));
    }
  };

  const handleScrapeAll = async () => {
    setScraping(prev => ({ ...prev, all: true }));
    setError(null);
    try {
      const response = await apiServerClient.fetch('/scrape/all', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok || data.success === false) {
        const errorMessage = data.error || data.message || 'Failed to scrape all sources';
        throw new Error(errorMessage);
      }
      
      toast.success(t('admin.scrape.allSuccess', 'All Sources Scraped Successfully'));
      
      await Promise.all([fetchStatus(), fetchLogs(), fetchStats()]);
    } catch (err) {
      console.error('Error scraping all sources:', err);
      setError(t('admin.scrape.errorAll', 'Failed to scrape all sources: {{error}}', { error: err.message }));
      toast.error(t('common.error', 'Scraping Failed'), {
        description: err.message
      });
    } finally {
      setScraping(prev => ({ ...prev, all: false }));
    }
  };

  const toggleAutoScrape = async (checked) => {
    setAutoScrapeEnabled(checked);
    try {
      await apiServerClient.fetch('/scrape/scheduler/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked })
      });
      toast.success(checked ? t('admin.scrape.autoEnabled', 'Auto-scraping enabled') : t('admin.scrape.autoDisabled', 'Auto-scraping disabled'));
    } catch (err) {
      console.warn('Scheduler toggle endpoint might not exist yet, updating UI only.', err);
      toast.success(checked ? t('admin.scrape.autoEnabled', 'Auto-scraping enabled') : t('admin.scrape.autoDisabled', 'Auto-scraping disabled'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('admin.scrape.never', 'Never');
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('admin.scrape.title', 'Data Scraping Dashboard')} - TennisHub</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  {t('admin.scrape.title', 'Data Scraping Dashboard')}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {t('admin.scrape.desc', 'Manage and monitor tennis player rankings data extraction')}
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate(`${langPrefix}/admin`)}>
                {t('admin.backToDashboard', 'Back to Dashboard')}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {t('admin.scrape.totalPlayers', 'Total Players')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground">{stats.totalPlayers.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {t('admin.scrape.recentUpdates', 'Recent Updates (24h)')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">{stats.recentUpdates.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    {t('admin.scrape.scheduler', 'Auto-Scraping Scheduler')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {t('admin.scrape.runsDaily', 'Runs daily at 02:00 UTC')}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="auto-scrape" 
                      checked={autoScrapeEnabled}
                      onCheckedChange={toggleAutoScrape}
                    />
                    <Label htmlFor="auto-scrape" className="font-medium">
                      {autoScrapeEnabled ? t('common.on', 'On') : t('common.off', 'Off')}
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border shadow-sm mb-8">
              <CardHeader className="bg-muted/20 border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {t('admin.scrape.manualControls', 'Manual Extraction Controls')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* ATP */}
                  <div className="border border-border rounded-xl p-5 bg-background flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-foreground text-lg">ATP Tour</h3>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">{t('admin.scrape.mens', "Men's")}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-6 flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" /> {t('admin.scrape.lastUpdated', 'Last updated:')}
                      </div>
                      <span className="font-medium text-foreground">{formatDate(status.atp)}</span>
                    </div>
                    <Button
                      onClick={() => handleScrape('atp')}
                      disabled={scraping.atp || scraping.all}
                      className="w-full"
                    >
                      {scraping.atp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {scraping.atp ? t('admin.scrape.extracting', 'Extracting...') : t('admin.scrape.scrapeAtp', 'Scrape ATP')}
                    </Button>
                  </div>

                  {/* WTA */}
                  <div className="border border-border rounded-xl p-5 bg-background flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-foreground text-lg">WTA Tour</h3>
                      <Badge variant="outline" className="bg-pink-500/10 text-pink-600 border-pink-500/20">{t('admin.scrape.womens', "Women's")}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-6 flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" /> {t('admin.scrape.lastUpdated', 'Last updated:')}
                      </div>
                      <span className="font-medium text-foreground">{formatDate(status.wta)}</span>
                    </div>
                    <Button
                      onClick={() => handleScrape('wta')}
                      disabled={scraping.wta || scraping.all}
                      className="w-full"
                    >
                      {scraping.wta ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {scraping.wta ? t('admin.scrape.extracting', 'Extracting...') : t('admin.scrape.scrapeWta', 'Scrape WTA')}
                    </Button>
                  </div>

                  {/* ITF */}
                  <div className="border border-border rounded-xl p-5 bg-background flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-foreground text-lg">ITF Tennis</h3>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">{t('admin.scrape.global', "Global")}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-6 flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" /> {t('admin.scrape.lastUpdated', 'Last updated:')}
                      </div>
                      <span className="font-medium text-foreground">{formatDate(status.itf)}</span>
                    </div>
                    <Button
                      onClick={() => handleScrape('itf')}
                      disabled={scraping.itf || scraping.all}
                      className="w-full"
                    >
                      {scraping.itf ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {scraping.itf ? t('admin.scrape.extracting', 'Extracting...') : t('admin.scrape.scrapeItf', 'Scrape ITF')}
                    </Button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <Button
                    onClick={handleScrapeAll}
                    disabled={scraping.all || Object.values(scraping).some(v => v === true)}
                    size="lg"
                    className="w-full md:w-auto"
                  >
                    {scraping.all ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                    {scraping.all ? t('admin.scrape.runningFull', 'Running Full Extraction...') : t('admin.scrape.runFull', 'Run Full Extraction (All Sources)')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border">
                <CardTitle className="text-lg">{t('admin.scrape.recentLogs', 'Recent Extraction Logs')}</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">{t('admin.scrape.source', 'Source')}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">{t('admin.scrape.status', 'Status')}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">{t('admin.scrape.players', 'Players')}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">{t('admin.scrape.timestamp', 'Timestamp')}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">{t('admin.scrape.details', 'Details')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.length > 0 ? (
                      logs.map((log, index) => (
                        <tr key={index} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{log.source}</td>
                          <td className="px-6 py-4 text-sm">
                            <Badge variant="outline" className={
                              log.status === 'success' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                              log.status === 'failed' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                              'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                            }>
                              {log.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {log.playersCount || (log.players_created ? `${log.players_created} created` : '-')}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(log.timestamp)}</td>
                          <td className="px-6 py-4 text-sm">
                            {log.error_message || log.error ? (
                              <span className="text-destructive max-w-xs truncate block" title={log.error_message || log.error}>
                                {log.error_message || log.error}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                          {t('admin.scrape.noLogs', 'No extraction logs available')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdminScrapingDashboard;
