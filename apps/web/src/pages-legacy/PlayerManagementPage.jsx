export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import PlayerForm from '@/components/PlayerForm.jsx';
import PlayerTableRow from '@/components/PlayerTableRow.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Plus, Search, Download, Trash2, ArrowUpDown, ArrowLeft, Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Copy, TerminalSquare, ChevronDown, Beaker } from 'lucide-react';

// ── Excel Parsing ───────────────────────────────────────────────────────────

function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const players = [];
        const errors = [];

        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
          
          let inferredSource = '';
          const lowerSheetName = sheetName.toLowerCase();
          if (['atp', 'wta', 'itf'].includes(lowerSheetName)) {
            inferredSource = lowerSheetName;
          }

          rows.forEach((row, idx) => {
            const get = (key) => {
              const match = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
              return match !== undefined ? row[match] : '';
            };

            const name = String(get('Name') || '').trim();
            const source = String(get('Source') || inferredSource).trim().toLowerCase();
            const ranking = parseInt(get('Ranking'), 10) || 0;
            const points = parseInt(get('Points'), 10) || 0;
            const country = String(get('Country') || '').trim();
            
            const rawAge = get('Age');
            const age = rawAge ? parseInt(rawAge, 10) : null;

            if (!name || !source || !['atp', 'wta', 'itf'].includes(source)) {
              if (name || source) {
                errors.push(`Sheet "${sheetName}" Row ${idx + 2}: Name="${name}" Source="${source}" — Invalid or missing required data, skipped`);
              }
              return;
            }

            players.push({ name, source, ranking, points, country, age, profile_url: '' });
          });
        });

        resolve({ players, errors });
      } catch (err) {
        reject(new Error(`Excel parsing failed: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });
}

// ── Import Preview Dialog ───────────────────────────────────────────────────

function ImportDialog({ open, onClose, onConfirm, preview, parseErrors }) {
  const { t } = useTranslation();
  const atpCount = preview.filter(p => p.source === 'atp').length;
  const wtaCount = preview.filter(p => p.source === 'wta').length;
  const itfCount = preview.filter(p => p.source === 'itf').length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {t('admin.players.import.previewTitle', 'Confirm Import')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'ATP', count: atpCount, color: 'text-blue-600' },
              { label: 'WTA', count: wtaCount, color: 'text-pink-600' },
              { label: 'ITF', count: itfCount, color: 'text-green-600' },
            ].map(({ label, count, color }) => (
              <Card key={label} className="border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{count}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground flex items-start gap-2">
            <TerminalSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p><strong>Show Console Logs:</strong> Please open your browser Developer Tools (F12) to see detailed real-time logs during the import process.</p>
          </div>

          {parseErrors.length > 0 && (
            <div className="border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Skipped Rows ({parseErrors.length})
              </p>
              <ul className="text-xs text-yellow-600 dark:text-yellow-500 space-y-1 max-h-28 overflow-y-auto">
                {parseErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                Data Preview (First 5 of {preview.length})
              </p>
              <div className="rounded-lg border border-border overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      {['Rank', 'Name', 'Country', 'Points', 'Source'].map(h => (
                        <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((p, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td className="px-2 py-1.5">{p.ranking}</td>
                        <td className="px-2 py-1.5 font-medium">{p.name}</td>
                        <td className="px-2 py-1.5">{p.country}</td>
                        <td className="px-2 py-1.5">{p.points}</td>
                        <td className="px-2 py-1.5">
                          <Badge variant="outline" className="text-[10px] uppercase">{p.source}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4">
          <Button variant="outline" onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button variant="secondary" onClick={() => onConfirm(preview, true)} disabled={preview.length === 0}>
            Test Import (First 2)
          </Button>
          <Button onClick={() => onConfirm(preview, false)} disabled={preview.length === 0}>
            <Upload className="h-4 w-4 mr-2" />
            Import All ({preview.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Import Progress Dialog ──────────────────────────────────────────────────

function ImportProgressDialog({ open, progress, total, done, result, isTest, errorDetails, onClose }) {
  const { t } = useTranslation();
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;
  const [isErrorsOpen, setIsErrorsOpen] = useState(false);

  const copyErrorLog = () => {
    const text = errorDetails.map(e => 
      `Player: ${e.playerName} (${e.source})\n` +
      `Error: ${e.errorMessage}\n` +
      `PocketBase Details: ${JSON.stringify(e.details)}\n` +
      `Attempted Data: ${JSON.stringify(e.attemptedData, null, 2)}`
    ).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Error log copied to clipboard');
  };

  const uniqueErrors = [...new Set(errorDetails.map(e => e.errorMessage))];

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent className="sm:max-w-[560px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {done
              ? <CheckCircle2 className="h-5 w-5 text-green-500" />
              : <Upload className="h-5 w-5 text-primary animate-pulse" />}
            {done
              ? (isTest ? 'Test Import Complete' : 'Import Complete')
              : (isTest ? 'Testing Import...' : 'Importing...')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Progress value={pct} className="h-2" />
          <p className="text-center text-sm text-muted-foreground">
            {progress} / {total} ({pct}%)
          </p>

          {done && result && (
            <div className="grid grid-cols-3 gap-3 text-center text-sm mb-4">
              <div>
                <p className="font-bold text-green-600 text-lg">{result.total.created}</p>
                <p className="text-muted-foreground text-xs">Created</p>
              </div>
              <div>
                <p className="font-bold text-blue-600 text-lg">{result.total.updated}</p>
                <p className="text-muted-foreground text-xs">Updated</p>
              </div>
              <div>
                <p className="font-bold text-red-500 text-lg">{result.total.failed}</p>
                <p className="text-muted-foreground text-xs">Failed</p>
              </div>
            </div>
          )}

          {errorDetails.length > 0 && (
            <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-3 mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-destructive flex items-center gap-1 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errorDetails.length} Records Failed
                </h4>
                <Button variant="outline" size="sm" onClick={copyErrorLog} className="h-7 text-xs bg-background">
                  <Copy className="h-3 w-3 mr-1" /> Copy Error Log
                </Button>
              </div>

              <div className="text-xs text-muted-foreground mb-3">
                <span className="font-medium text-foreground">Common issues:</span> {uniqueErrors.join(', ')}
              </div>

              <Collapsible open={isErrorsOpen} onOpenChange={setIsErrorsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs bg-background/50">
                    {isErrorsOpen ? 'Hide Error Details' : 'Show Error Details (First 10)'}
                    <ChevronDown className={`h-3 w-3 transition-transform ${isErrorsOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {errorDetails.slice(0, 10).map((err, idx) => (
                    <div key={idx} className="bg-background rounded border border-border p-2 text-xs font-mono">
                      <p className="font-bold text-destructive mb-1">{err.playerName} ({err.source.toUpperCase()})</p>
                      <p className="text-muted-foreground mb-1">Error: {err.errorMessage}</p>
                      <details>
                        <summary className="cursor-pointer text-primary opacity-80 hover:opacity-100">View Data Object</summary>
                        <pre className="mt-1 p-2 bg-muted rounded overflow-x-auto text-[10px]">
                          {JSON.stringify(err.attemptedData, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                  {errorDetails.length > 10 && (
                    <p className="text-xs text-center text-muted-foreground pt-2">
                      ...and {errorDetails.length - 10} more errors. Copy log to see all.
                    </p>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>

        {done && (
          <DialogFooter>
            <Button onClick={onClose} className="w-full">Close & Refresh</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page Component ─────────────────────────────────────────────────────

const PlayerManagementPage = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'ranking', direction: 'asc' });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [deletingPlayer, setDeletingPlayer] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [stats, setStats] = useState({ total: 0, atp: 0, wta: 0, itf: 0 });
  const [activityLog, setActivityLog] = useState([]);

  // Import State
  const fileInputRef = useRef(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importParseErrors, setImportParseErrors] = useState([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  const [showImportProgress, setShowImportProgress] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importDone, setImportDone] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importIsTest, setImportIsTest] = useState(false);
  const [importErrorDetails, setImportErrorDetails] = useState([]);

  const langPrefix = `/${currentLanguage}`;

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate(langPrefix, { replace: true });
    }
  }, [currentUser, navigate, langPrefix]);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      let filterStr = '';
      const filters = [];

      if (searchTerm) {
        filters.push(`(name ~ "${searchTerm}" || country ~ "${searchTerm}")`);
      }
      if (sourceFilter !== 'all') {
        filters.push(`source = "${sourceFilter}"`);
      }

      if (filters.length > 0) {
        filterStr = filters.join(' && ');
      }

      const sortStr = `${sortConfig.direction === 'desc' ? '-' : ''}${sortConfig.key}`;

      const result = await pb.collection('players').getList(1, 100, {
        filter: filterStr,
        sort: sortStr,
        $autoCancel: false
      });

      setPlayers(result.items);

      const atp = result.items.filter(p => p.source === 'atp').length;
      const wta = result.items.filter(p => p.source === 'wta').length;
      const itf = result.items.filter(p => p.source === 'itf').length;
      setStats({ total: result.totalItems, atp, wta, itf });

    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error(t('common.error', 'Failed to load players'));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sourceFilter, sortConfig, t]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPlayers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchPlayers]);

  useEffect(() => {
    const savedLog = localStorage.getItem('playerActivityLog');
    if (savedLog) {
      try {
        setActivityLog(JSON.parse(savedLog));
      } catch (e) {
        console.error('Failed to parse activity log');
      }
    }
  }, []);

  const logActivity = (action, playerName) => {
    const newLog = [{ action, playerName, timestamp: new Date().toISOString() }, ...activityLog].slice(0, 10);
    setActivityLog(newLog);
    localStorage.setItem('playerActivityLog', JSON.stringify(newLog));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const { players: parsed, errors } = await parseExcel(file);
      setImportPreview(parsed);
      setImportParseErrors(errors);
      setShowImportDialog(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTestWTACreate = async () => {
    const payload = {
      name: 'Test WTA Player',
      ranking: 999,
      country: 'Test Country',
      points: 0,
      source: 'wta'
    };
    
    console.log('[TEST] Testing WTA create with payload:', payload);
    
    try {
      const response = await pb.collection('players').create(payload, { $autoCancel: false });
      console.log('[TEST] WTA test result:', response);
      toast.success('WTA test successful: ' + response.id);
      fetchPlayers(); // Refresh the list
    } catch (error) {
      console.error('[TEST] WTA test failed:', error.message);
      if (error.response) {
        console.error('[TEST] PocketBase validation errors:', error.response.data);
      }
      toast.error('WTA test failed: ' + error.message);
    }
  };

  /*
   * Debugging instructions for Task 4:
   * 1. Open DevTools (F12) -> Console tab.
   * 2. Upload the WTA excel file.
   * 3. Look for '[IMPORT]' prefix in logs:
   *    - Check if "Source value being assigned: wta" is correct.
   *    - Check if "Duplicate check result: { exists: false }" for new records.
   *    - Check if "Creating player record with payload: { ... source: 'wta' }" is correct.
   *    - If it fails, check "Player creation failed: [error]".
   * 4. If creation succeeds but records aren't showing in the UI, go to PocketBase admin -> Data -> players.
   *    - If records exist there, the issue is likely in the Filter/Fetch logic of the UI.
   *    - If they do NOT exist, the creation API calls are failing silently or being blocked.
   */
  const handleImportConfirm = async (playersToImport, isTest = false) => {
    const runList = isTest ? playersToImport.slice(0, 2) : playersToImport;
    
    setShowImportDialog(false);
    setImportIsTest(isTest);
    setImportProgress(0);
    setImportTotal(runList.length);
    setImportDone(false);
    setImportResult(null);
    setImportErrorDetails([]);
    setShowImportProgress(true);

    console.log('[IMPORT] Starting Excel import, total rows:', runList.length);
    console.log('Parsed Excel Data (First 3):', runList.slice(0, 3));

    const result = {
      total: { created: 0, updated: 0, failed: 0 },
      atp: { created: 0, updated: 0, failed: 0 },
      wta: { created: 0, updated: 0, failed: 0 },
      itf: { created: 0, updated: 0, failed: 0 }
    };
    
    const errorsList = [];

    for (let i = 0; i < runList.length; i++) {
      const p = runList[i];
      const src = (p.source || '').toLowerCase();

      console.log(`[IMPORT] Row index ${i} and raw data:`, p);
      console.log(`[IMPORT] Source value being assigned:`, src);

      // 1. Data Construction
      const payload = {
        name: String(p.name || '').trim(),
        source: src,
        ranking: p.ranking ? Number(p.ranking) : 0,
        country: String(p.country || '').trim(),
        points: p.points ? Number(p.points) : 0,
        profile_url: p.profile_url || '',
      };
      
      if (p.age !== null && !isNaN(p.age)) {
        payload.age = Number(p.age);
      }

      try {
        if (!payload.name) throw new Error("Validation Error: Missing required field 'name'");
        if (!payload.source || !['atp', 'wta', 'itf'].includes(payload.source)) {
          throw new Error(`Validation Error: Invalid or missing 'source' (${payload.source})`);
        }

        // 2. Query Escaping & Duplicate Check
        const escapedName = payload.name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const filterQuery = `name="${escapedName}" && source="${payload.source}"`;
        
        console.log(`[IMPORT] Checking for duplicate with filter:`, filterQuery);

        const existing = await pb.collection('players').getList(1, 1, {
          filter: filterQuery,
          $autoCancel: false,
        });
        
        console.log('[IMPORT] Duplicate check result:', { exists: existing.items.length > 0, record: existing.items.length > 0 ? existing.items[0] : null });

        // 3. Upsert Logic
        if (existing.items.length > 0) {
          const recordId = existing.items[0].id;
          console.log('[IMPORT] Updating player record:', { id: recordId, name: payload.name, source: payload.source });
          
          await pb.collection('players').update(recordId, payload, { $autoCancel: false });
          
          result.total.updated++;
          if (result[src]) result[src].updated++;
        } else {
          console.log('[IMPORT] Creating player record with payload:', payload);
          console.log('[IMPORT] Exact source value in payload:', payload.source);
          
          const newRecord = await pb.collection('players').create(payload, { $autoCancel: false });
          
          console.log('[IMPORT] Player created successfully:', { id: newRecord.id, name: newRecord.name, source: newRecord.source });
          
          result.total.created++;
          if (result[src]) result[src].created++;
        }
      } catch (err) {
        console.error(`[IMPORT] Player creation/update failed for ${payload.name} (${payload.source}):`, err.message);
        
        let errorMsg = err.message || 'Unknown error occurred';
        let errDetails = {};

        if (err.response) {
          console.error('[IMPORT] PocketBase Error Status:', err.status);
          console.error('[IMPORT] PocketBase Error Response Data:', err.response);
          errorMsg = err.response.message || errorMsg;
          errDetails = err.response.data || err.response;
        }

        result.total.failed++;
        if (result[src]) result[src].failed++;

        errorsList.push({
          playerName: payload.name,
          source: payload.source,
          errorMessage: errorMsg,
          details: errDetails,
          attemptedData: payload
        });
      }
      
      setImportProgress(i + 1);
      if (errorsList.length > 0) {
        setImportErrorDetails([...errorsList]);
      }
    }

    setImportResult(result);
    setImportDone(true);
    logActivity(isTest ? 'Tested Import' : 'Imported', `${result.total.created + result.total.updated} players`);

    console.log('[IMPORT] Final import summary:', { 
      totalRows: runList.length, 
      created: result.total.created, 
      updated: result.total.updated, 
      failed: result.total.failed, 
      bySource: { atp: result.atp, wta: result.wta, itf: result.itf } 
    });
    
    if (errorsList.length > 0) {
      console.log(`[IMPORT] Total Errors: ${errorsList.length}`, errorsList);
    }

    if (errorsList.length === 0 && !isTest) {
      setTimeout(() => {
        handleCloseImportProgress(result);
      }, 2000);
    }
  };

  const handleCloseImportProgress = (resultObj = importResult) => {
    setShowImportProgress(false);
    fetchPlayers();
    
    if (resultObj) {
      const detailsMsg = `Total: ${resultObj.total.created} created, ${resultObj.total.updated} updated, ${resultObj.total.failed} failed.\n` +
        `ATP (C:${resultObj.atp.created} U:${resultObj.atp.updated} F:${resultObj.atp.failed}) | ` +
        `WTA (C:${resultObj.wta.created} U:${resultObj.wta.updated} F:${resultObj.wta.failed}) | ` +
        `ITF (C:${resultObj.itf.created} U:${resultObj.itf.updated} F:${resultObj.itf.failed})`;

      toast.success(importIsTest ? 'Test Import Complete' : 'Import Complete', {
        description: detailsMsg,
        duration: 8000
      });
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleInlineUpdate = async (id, data) => {
    try {
      const updated = await pb.collection('players').update(id, data, { $autoCancel: false });
      setPlayers(players.map(p => p.id === id ? updated : p));
      toast.success(t('common.success', 'Player updated'));
      logActivity('Updated', updated.name);
    } catch (error) {
      toast.error(error.message || t('common.error', 'Failed to update player'));
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingPlayer) return;
    try {
      await pb.collection('players').delete(deletingPlayer.id, { $autoCancel: false });
      toast.success(t('common.success', 'Player deleted'));
      logActivity('Deleted', deletingPlayer.name);
      setDeletingPlayer(null);
      fetchPlayers();
    } catch (error) {
      toast.error(t('common.error', 'Failed to delete player'));
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        pb.collection('players').delete(id, { $autoCancel: false })
      );
      await Promise.all(promises);
      toast.success(`Deleted ${selectedIds.size} players`);
      logActivity('Bulk Deleted', `${selectedIds.size} players`);
      setSelectedIds(new Set());
      fetchPlayers();
    } catch (error) {
      toast.error(t('common.error', 'Failed to delete some players'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelection = (id, checked) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const toggleAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(players.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Ranking', 'Country', 'Points', 'Age', 'Source'].join(','),
      ...players.map(p => [
        `"${p.name || ''}"`,
        p.ranking || '',
        `"${p.country || ''}"`,
        p.points || '',
        p.age || '',
        p.source || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `players_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export started');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setEditingPlayer(null);
        setIsFormOpen(true);
      } else if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        handleExport();
      } else if (e.key === 'Delete' && selectedIds.size > 0 && !isFormOpen && !deletingPlayer) {
        e.preventDefault();
        setIsBulkDeleting(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, isFormOpen, deletingPlayer]);

  if (!currentUser || currentUser.role !== 'admin') return null;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Helmet>
        <title>{t('admin.players.title', 'Player Management')} - TennisHub</title>
      </Helmet>
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(`${langPrefix}/admin`)} className="h-8 px-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" /> {t('admin.backToDashboard', 'Back')}
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('admin.players.title', 'Player Management')}</h1>
            <p className="text-muted-foreground">{t('admin.players.desc', 'Manage tennis player data, rankings, and profiles.')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleTestWTACreate} className="bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-200">
              <Beaker className="h-4 w-4 mr-2" /> Test WTA Create
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> {t('admin.players.export', 'Export')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Import Excel
            </Button>
            <Button onClick={() => { setEditingPlayer(null); setIsFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> {t('admin.players.addPlayer', 'Add Player')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground font-medium">{t('admin.players.totalPlayers', 'Total Players')}</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground font-medium">{t('admin.players.atpPlayers', 'ATP Players')}</p>
              <p className="text-2xl font-bold text-blue-600">{stats.atp}</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground font-medium">{t('admin.players.wtaPlayers', 'WTA Players')}</p>
              <p className="text-2xl font-bold text-pink-600">{stats.wta}</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground font-medium">{t('admin.players.itfPlayers', 'ITF Players')}</p>
              <p className="text-2xl font-bold text-green-600">{stats.itf}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.players.search', 'Search players or countries...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue placeholder={t('admin.players.filterSource', 'Filter by Source')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.players.allSources', 'All Sources')}</SelectItem>
                <SelectItem value="atp">ATP</SelectItem>
                <SelectItem value="wta">WTA</SelectItem>
                <SelectItem value="itf">ITF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIds.size > 0 && (
            <Button variant="destructive" onClick={() => setIsBulkDeleting(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> {t('admin.players.deleteSelected', 'Delete Selected')} ({selectedIds.size})
            </Button>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={players.length > 0 && selectedIds.size === players.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary" onClick={() => handleSort('ranking')}>
                    <div className="flex items-center">{t('admin.players.rank', 'Rank')} <ArrowUpDown className="ml-1 h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary" onClick={() => handleSort('name')}>
                    <div className="flex items-center">{t('common.name', 'Name')} <ArrowUpDown className="ml-1 h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary" onClick={() => handleSort('country')}>
                    <div className="flex items-center">{t('common.country', 'Country')} <ArrowUpDown className="ml-1 h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary" onClick={() => handleSort('points')}>
                    <div className="flex items-center">{t('admin.players.points', 'Points')} <ArrowUpDown className="ml-1 h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary" onClick={() => handleSort('age')}>
                    <div className="flex items-center">{t('admin.players.age', 'Age')} <ArrowUpDown className="ml-1 h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary" onClick={() => handleSort('source')}>
                    <div className="flex items-center">{t('admin.players.source', 'Source')} <ArrowUpDown className="ml-1 h-3 w-3" /></div>
                  </TableHead>
                  <TableHead>{t('admin.players.lastUpdated', 'Last Updated')}</TableHead>
                  <TableHead className="text-right">{t('admin.table.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      {t('admin.players.noPlayers', 'No players found.')}
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map(player => (
                    <PlayerTableRow
                      key={player.id}
                      player={player}
                      isSelected={selectedIds.has(player.id)}
                      onSelect={toggleSelection}
                      onEdit={(p) => { setEditingPlayer(p); setIsFormOpen(true); }}
                      onDelete={(p) => setDeletingPlayer(p)}
                      onInlineUpdate={handleInlineUpdate}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {activityLog.length > 0 && (
          <div className="mt-8 bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{t('admin.players.recentActivity', 'Recent Activity')}</h3>
            <div className="space-y-3">
              {activityLog.map((log, i) => (
                <div key={i} className="flex items-center text-sm">
                  <span className="text-muted-foreground w-32">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <Badge variant="outline" className="mr-2">{log.action}</Badge>
                  <span className="font-medium">{log.playerName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlayer ? t('admin.players.editPlayer', 'Edit Player') : t('admin.players.addPlayer', 'Add New Player')}</DialogTitle>
          </DialogHeader>
          <PlayerForm
            player={editingPlayer}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchPlayers();
              logActivity(editingPlayer ? 'Updated' : 'Created', 'Player');
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPlayer} onOpenChange={(open) => !open && setDeletingPlayer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteConfirmTitle', 'Are you absolutely sure?')}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingPlayer?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleting && selectedIds.size > 0} onOpenChange={(open) => !open && setIsBulkDeleting(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Players</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected players? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onConfirm={handleImportConfirm}
        preview={importPreview}
        parseErrors={importParseErrors}
      />

      <ImportProgressDialog
        open={showImportProgress}
        progress={importProgress}
        total={importTotal}
        done={importDone}
        result={importResult}
        isTest={importIsTest}
        errorDetails={importErrorDetails}
        onClose={() => handleCloseImportProgress()}
      />
    </div>
  );
};

export default PlayerManagementPage;
