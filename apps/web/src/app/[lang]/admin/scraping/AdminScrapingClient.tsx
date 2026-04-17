// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, Loader2, AlertCircle, RefreshCw, Play, Globe, Activity, Database, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

const localizedRouteNames: Record<string, Record<LangCode, string>> = {
  login: { en: 'login', zh: '登录', ja: 'ログイン', es: 'iniciar-sesion', fr: 'connexion' },
};

const SOURCE_LABELS = {
  atp: 'ATP',
  wta: 'WTA',
  itf: 'ITF',
};

const AdminScrapingClient = ({ lang }: { lang: LangCode }) => {
  const { currentUser } = useAuth();
  const t = useTranslations();
  const router = useRouter();

  const [status, setStatus] = useState({ atp: null, wta: null, itf: null });
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalPlayers: 0, recentUpdates: 0 });
  const [loading, setLoading] = useState(true);
  const [scrapeLoading, setScrapeLoading] = useState({});
  const [fullScrapeLoading, setFullScrapeLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/scrape?action=status');
      if (res.ok) {
        const json = await res.json();
        setStatus(json.data || {});
      }
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/scrape?action=logs&perPage=50');
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data?.logs || []);
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/scrape?action=stats');
      if (res.ok) {
        const json = await res.json();
        const statsData = json.data || {};
        setStats({
          totalPlayers: statsData.totalPlayers || 0,
          recentUpdates: statsData.recentUpdates || 0,
        });
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStatus(), fetchLogs(), fetchStats()]);
    setLoading(false);
  }, [fetchStatus, fetchLogs, fetchStats]);

  useEffect(() => {
    if (!currentUser) {
      router.push(`/${lang}/${localizedRouteNames.login[lang]}`);
      return;
    }
    if (currentUser.role !== 'admin') {
      router.push(`/${lang}`);
      return;
    }
    refreshAll();
  }, [currentUser, lang, router, refreshAll]);

  const triggerScrape = async (source) => {
    setScrapeLoading(prev => ({ ...prev, [source]: true }));
    setScrapeResult(null);
    try {
      const res = await fetch(`/api/scrape/${source}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `${source.toUpperCase()} scrape completed`);
        setScrapeResult({ [source]: data });
      } else {
        toast.error(data.message || `${source.toUpperCase()} scrape failed`);
      }
    } catch (e) {
      toast.error(`Failed to scrape ${source.toUpperCase()}`);
    } finally {
      setScrapeLoading(prev => ({ ...prev, [source]: false }));
      refreshAll();
    }
  };

  const triggerFullScrape = async () => {
    setFullScrapeLoading(true);
    setScrapeResult(null);
    try {
      const res = await fetch('/api/scrape', { method: 'POST' });
      const data = await res.json();
      setScrapeResult(data);
      if (data.status === 'ok') {
        toast.success('Full scrape completed');
      } else {
        toast.warning(data.errors?.join(', ') || 'Partial scrape completed with errors');
      }
    } catch (e) {
      toast.error('Failed to trigger full scrape');
    } finally {
      setFullScrapeLoading(false);
      refreshAll();
    }
  };

  if (!currentUser) return null;

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString();
  };

  const getTimeSince = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'just now';
  };

  const renderStatusBadge = (ts, source) => {
    if (!ts) return <Badge variant="outline">Never</Badge>;
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-3 w-3 text-green-500" />
        <span>{getTimeSince(ts)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Header */}
        <section className="bg-muted py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Scraping Control
              </h1>
              <p className="text-muted-foreground">
                Manage tennis data scraping from ATP, WTA, and ITF sources.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Players
                  </CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.totalPlayers}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Recent Updates (24h)
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.recentUpdates}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Last Full Scrape
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <div className="text-lg font-semibold">
                      {formatTimestamp(status.atp)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Scrape Result Alert */}
            {scrapeResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Alert variant={scrapeResult.success !== false ? 'default' : 'destructive'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    {scrapeResult.success !== false ? 'Scrape Completed' : 'Scrape Errors'}
                  </AlertTitle>
                  <AlertDescription>
                    {scrapeResult.message}
                    {scrapeResult.data && Object.entries(scrapeResult.data).map(([source, data]) => {
                      if (!data) return null;
                      return (
                        <div key={source} className="mt-1 text-sm">
                          <strong>{SOURCE_LABELS[source] || source}:</strong>{' '}
                          {data.count} players, {data.created} created, {data.updated} updated
                        </div>
                      );
                    })}
                    {scrapeResult.errors && Object.entries(scrapeResult.errors).map(([source, err]) => (
                      <div key={source} className="mt-1 text-sm text-destructive">
                        <strong>{SOURCE_LABELS[source] || source}:</strong> {err}
                      </div>
                    ))}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="scrape" className="space-y-6">
              <TabsList>
                <TabsTrigger value="scrape">Scrape</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>

              {/* Scrape Tab */}
              <TabsContent value="scrape">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Source Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Sources</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                        </div>
                      ) : (
                        <>
                          {['atp', 'wta', 'itf'].map(source => (
                            <div key={source} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <div className="font-semibold text-lg">
                                  {SOURCE_LABELS[source]}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Last: {formatTimestamp(status[source])}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {renderStatusBadge(status[source], source)}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => triggerScrape(source)}
                                  disabled={scrapeLoading[source]}
                                >
                                  {scrapeLoading[source] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                  <span className="ml-2">Scrape</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Full Scrape */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Full Scrape</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Scrape all ATP, WTA, and ITF sources sequentially. This will update all player data in the database.
                      </p>
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={triggerFullScrape}
                        disabled={fullScrapeLoading}
                      >
                        {fullScrapeLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                          <Globe className="h-5 w-5 mr-2" />
                        )}
                        Scrape All Sources
                      </Button>
                      <div className="text-xs text-muted-foreground text-center">
                        Note: Full scrape may take several minutes depending on network conditions.
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Logs Tab */}
              <TabsContent value="logs">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Scrape Logs</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={refreshAll}
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                      </div>
                    ) : logs.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No scrape logs found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Time</TableHead>
                              <TableHead>Source</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Players</TableHead>
                              <TableHead>Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {logs.map((log, index) => {
                              let syncData = null;
                              try {
                                syncData = log.syncResult ? JSON.parse(log.syncResult) : null;
                              } catch (e) {}
                              return (
                                <TableRow key={log.id || index}>
                                  <TableCell className="whitespace-nowrap text-sm">
                                    {formatTimestamp(log.createdAt)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{log.source}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {log.status === 'success' ? (
                                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Success
                                      </Badge>
                                    ) : log.status === 'partial' ? (
                                      <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                                        Partial
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Failed
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {log.players !== undefined ? (
                                      <span>{log.players} total</span>
                                    ) : (
                                      <span>—</span>
                                    )}
                                    {syncData && (
                                      <span className="ml-2 text-muted-foreground">
                                        ({syncData.created} created, {syncData.updated} updated)
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                    {log.errors || '—'}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminScrapingClient;
