import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    ChevronRight, ChevronDown, Folder, FolderOpen,
    Files, Play, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Eye,
    FileText, FileImage, FileCode, Wand2, Type, ArrowLeftRight, Hash,
    SlidersHorizontal, RefreshCw, X, Home, HardDrive, ChevronLeft, ListOrdered, Link
} from 'lucide-react';
import {
    ListDirectory, GetHomePath, GetFileInfos,
    BatchRename, ResizeImages, ResizeImagesOnly, PreviewRename, SelectDirectory
} from '../wailsjs/go/main/App';

// ─── Types ────────────────────────────────────────────────────────────────────
type RuleType = 'replace' | 'affixes' | 'case' | 'sequence';
interface Rule {
    id: string; type: RuleType; enabled: boolean;
    search: string; replace: string; useRegex: boolean;
    prefix: string; suffix: string; caseType: 'upper' | 'lower' | 'title' | 'sentence';
    seqStart: number; seqPad: number; seqSeparator: string;
}
interface FileInfo {
    path: string; name: string; ext: string; sizeBytes: number; sizeLabel: string;
}
interface DirEntry {
    name: string; path: string; isDir: boolean; ext: string; size: number;
}
interface RenameResult {
    oldPath: string; newPath: string; oldName: string; newName: string; status: string; error: string;
}
interface ResizeResult {
    oldPath: string; newPath: string; oldName: string; newName: string;
    status: string; error: string;
    originalW: number; originalH: number; outputW: number; outputH: number;
    originalSize: number; outputSize: number;
}

function mkRule(type: RuleType): Rule {
    return { id: Math.random().toString(36).slice(2), type, enabled: true, search: '', replace: '', useRegex: false, prefix: '', suffix: '', caseType: 'title', seqStart: 1, seqPad: 3, seqSeparator: '_' };
}

function getFileIcon(ext: string, size = 14) {
    const img = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];
    const code = ['.js', '.ts', '.tsx', '.jsx', '.go', '.py', '.html', '.css', '.json'];
    if (img.includes(ext)) return <FileImage size={size} style={{ color: '#a78bfa' }} />;
    if (code.includes(ext)) return <FileCode size={size} style={{ color: '#7dd3fc' }} />;
    return <FileText size={size} style={{ color: '#94a3b8' }} />;
}

function extBadge(ext: string) {
    const img = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    if (img.includes(ext)) return 'badge-violet';
    if (ext === '.svg') return 'badge-sky';
    return 'badge-slate';
}

// ─── File Explorer ────────────────────────────────────────────────────────────
interface ExplorerProps {
    selectedPaths: Set<string>;
    onToggleFile: (path: string) => void;
    onAddAll: (paths: string[]) => void;
}

function FileExplorer({ selectedPaths, onToggleFile, onAddAll }: ExplorerProps) {
    const [currentPath, setCurrentPath] = useState('');
    const [entries, setEntries] = useState<DirEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<string[]>([]);

    const [lastIdx, setLastIdx] = useState<number | null>(null);

    // Load home on mount
    useEffect(() => {
        GetHomePath().then(home => navigate(home, []));
    }, []);

    const navigate = useCallback(async (path: string, hist: string[]) => {
        setLoading(true);
        setLastIdx(null);
        try {
            const items = await ListDirectory(path);
            setEntries(items);
            setCurrentPath(path);
            setHistory(hist);
        } finally { setLoading(false); }
    }, []);

    const goInto = (entry: DirEntry) => {
        if (entry.isDir) navigate(entry.path, [...history, currentPath]);
    };

    const goBack = () => {
        if (history.length > 0) {
            const prev = history[history.length - 1];
            navigate(prev, history.slice(0, -1));
        }
    };

    const goHome = () => {
        GetHomePath().then(home => navigate(home, []));
    };

    // Breadcrumb segments
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = parts.map((p, i) => ({ label: p, path: '/' + parts.slice(0, i + 1).join('/') }));

    const files = entries.filter(e => !e.isDir);
    const dirs = entries.filter(e => e.isDir);
    const allFilePaths = files.map(f => f.path);
    const selectedInDir = allFilePaths.filter(p => selectedPaths.has(p));
    const allSelected = files.length > 0 && selectedInDir.length === files.length;

    const toggleAll = () => {
        if (allSelected) {
            allFilePaths.forEach(p => selectedPaths.has(p) && onToggleFile(p));
        } else {
            onAddAll(allFilePaths.filter(p => !selectedPaths.has(p)));
        }
    };

    const handleFileClick = (e: React.MouseEvent, index: number, path: string) => {
        // If clicking a checkbox specifically, we still get the event here if bubbling
        // But let's handle the Shift logic on the row click too.
        if (e.shiftKey && lastIdx !== null) {
            const start = Math.min(lastIdx, index);
            const end = Math.max(lastIdx, index);
            const range = files.slice(start, end + 1).map(f => f.path);
            onAddAll(range.filter(p => !selectedPaths.has(p)));
        } else {
            onToggleFile(path);
        }
        setLastIdx(index);
    };

    return (
        <div className="explorer">
            {/* Toolbar */}
            <div className="explorer-toolbar">
                <button className="exp-btn" onClick={goBack} disabled={history.length === 0} title="Back">
                    <ChevronLeft size={14} />
                </button>
                <button className="exp-btn" onClick={goHome} title="Home">
                    <Home size={14} />
                </button>
                <div className="exp-crumbs">
                    <HardDrive size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                    {crumbs.slice(-3).map((c, i) => (
                        <React.Fragment key={c.path}>
                            {i > 0 && <ChevronRight size={10} style={{ opacity: 0.3, flexShrink: 0 }} />}
                            <button className="crumb" onClick={() => navigate(c.path, crumbs.slice(0, -3 + i).map(x => x.path))}>
                                {c.label}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Select All bar */}
            {files.length > 0 && (
                <div className="select-all-bar">
                    <label className="toggle-label">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                        <span style={{ fontSize: '11px' }}>Select all ({files.length} files)</span>
                    </label>
                    <span className="select-count">{selectedInDir.length} selected</span>
                </div>
            )}

            {/* Entries */}
            <div className="explorer-list">
                {loading ? (
                    <div className="exp-loading"><Loader2 size={18} className="spin" /> Loading…</div>
                ) : entries.length === 0 ? (
                    <div className="exp-empty">Empty folder</div>
                ) : (
                    <>
                        {dirs.map(entry => (
                            <button key={entry.path} className="exp-row exp-dir" onClick={() => goInto(entry)}>
                                <Folder size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                                <span className="exp-name">{entry.name}</span>
                                <ChevronRight size={12} style={{ opacity: 0.3, marginLeft: 'auto' }} />
                            </button>
                        ))}
                        {files.map((entry, idx) => {
                            const isSelected = selectedPaths.has(entry.path);
                            return (
                                <div
                                    key={entry.path}
                                    className={`exp-row exp-file ${isSelected ? 'exp-file-selected' : ''}`}
                                    onClick={(e) => handleFileClick(e, idx, entry.path)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        readOnly
                                        style={{ pointerEvents: 'none' }}
                                    />
                                    {getFileIcon(entry.ext, 13)}
                                    <span className="exp-name" title={entry.name}>{entry.name}</span>
                                    <span className="exp-size">{entry.size > 0 ? formatSize(entry.size) : ''}</span>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
}

function formatSize(b: number) {
    if (b < 1024) return `${b}B`;
    if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`;
    return `${(b / 1048576).toFixed(1)}MB`;
}

// ─── Rule Card ────────────────────────────────────────────────────────────────
function RuleCard({ rule, onChange, onRemove }: { rule: Rule; onChange: (r: Partial<Rule>) => void; onRemove: () => void }) {
    const icons: Record<RuleType, React.ReactNode> = {
        replace: <ArrowLeftRight size={14} />, affixes: <Plus size={14} />, case: <Type size={14} />, sequence: <ListOrdered size={14} />
    };
    const labels: Record<RuleType, string> = {
        replace: 'Search & Replace', affixes: 'Add Prefix / Suffix', case: 'Case Change', sequence: 'Add Sequence'
    };
    return (
        <div className={`rule-card ${rule.enabled ? 'rule-card-active' : ''}`}>
            <div className="rule-header">
                <div className="rule-icon">{icons[rule.type]}</div>
                <span className="rule-label">{labels[rule.type]}</span>
                <div className="rule-actions">
                    <label className="toggle">
                        <input type="checkbox" checked={rule.enabled} onChange={e => onChange({ enabled: e.target.checked })} />
                        <span className="toggle-track" />
                    </label>
                    <button className="btn-icon-ghost" onClick={onRemove}><X size={14} /></button>
                </div>
            </div>
            {rule.enabled && (
                <div className="rule-body">
                    {rule.type === 'replace' && (<>
                        <div className="field-row"><label>Find</label><input value={rule.search} onChange={e => onChange({ search: e.target.value })} placeholder="text to find" className="rule-input" /></div>
                        <div className="field-row"><label>Replace</label><input value={rule.replace} onChange={e => onChange({ replace: e.target.value })} placeholder="replacement" className="rule-input" /></div>
                        <div className="field-row">
                            <label className="toggle-label"><input type="checkbox" checked={rule.useRegex} onChange={e => onChange({ useRegex: e.target.checked })} /><span>Use Regex</span></label>
                        </div>
                    </>)}
                    {rule.type === 'affixes' && (
                        <div className="grid-2">
                            <div className="field-group"><label>Prefix</label><input value={rule.prefix} onChange={e => onChange({ prefix: e.target.value })} placeholder="2024_" className="rule-input" /></div>
                            <div className="field-group"><label>Suffix</label><input value={rule.suffix} onChange={e => onChange({ suffix: e.target.value })} placeholder="_final" className="rule-input" /></div>
                        </div>
                    )}
                    {rule.type === 'case' && (
                        <div className="field-row">
                            <label>Mode</label>
                            <select value={rule.caseType} onChange={e => onChange({ caseType: e.target.value as any })} className="rule-select">
                                <option value="title">Title Case</option>
                                <option value="upper">UPPERCASE</option>
                                <option value="lower">lowercase</option>
                                <option value="sentence">Sentence case</option>
                            </select>
                        </div>
                    )}
                    {rule.type === 'sequence' && (
                        <div className="grid-2">
                            <div className="field-group"><label>Start At</label><input type="number" value={rule.seqStart} onChange={e => onChange({ seqStart: +e.target.value })} className="rule-input" /></div>
                            <div className="field-group"><label>Padding</label><input type="number" value={rule.seqPad} onChange={e => onChange({ seqPad: +e.target.value })} className="rule-input" /></div>
                            <div className="field-group" style={{ gridColumn: '1 / -1' }}><label>Separator</label><input value={rule.seqSeparator} onChange={e => onChange({ seqSeparator: e.target.value })} placeholder="e.g. _ or -" className="rule-input" /></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
    const [fileInfos, setFileInfos] = useState<FileInfo[]>([]);
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
    const [rules, setRules] = useState<Rule[]>([mkRule('replace')]);
    const [resize, setResize] = useState({
        enabled: false,
        width: 1920, height: 1080,
        keepAspect: true,
        quality: 85,
        format: 'same',       // '' | 'jpeg' | 'png'
        resizeMode: 'fit',    // 'fit' | 'fill' | 'exact'
        outputDir: '',
        overwrite: false,
    });
    const [resizeResults, setResizeResults] = useState<ResizeResult[]>([]);
    const [isResizing, setIsResizing] = useState(false);
    const [previewResults, setPreviewResults] = useState<RenameResult[]>([]);
    const [execResults, setExecResults] = useState<RenameResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);

    const imageCount = useMemo(() => fileInfos.filter(f => ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'].includes(f.ext)).length, [fileInfos]);
    const jpgCount = useMemo(() => fileInfos.filter(f => ['.jpg', '.jpeg'].includes(f.ext)).length, [fileInfos]);
    const pngCount = useMemo(() => fileInfos.filter(f => f.ext === '.png').length, [fileInfos]);

    const toggleFile = useCallback(async (path: string) => {
        setSelectedPaths(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
                setFileInfos(fi => fi.filter(f => f.path !== path));
            } else {
                next.add(path);
                // Fetch info and add
                GetFileInfos([path]).then(infos => {
                    if (infos?.length) setFileInfos(fi => [...fi, ...infos.filter(i => !fi.find(f => f.path === i.path))]);
                });
            }
            return next;
        });
        setPreviewResults([]); setExecResults([]);
    }, []);

    const addAll = useCallback(async (paths: string[]) => {
        const infos = await GetFileInfos(paths);
        if (!infos?.length) return;
        setSelectedPaths(prev => { const next = new Set(prev); paths.forEach(p => next.add(p)); return next; });
        setFileInfos(prev => [...prev, ...infos.filter(i => !prev.find(f => f.path === i.path))]);
        setPreviewResults([]); setExecResults([]);
    }, []);

    const removeFromBatch = (path: string) => {
        setSelectedPaths(prev => { const n = new Set(prev); n.delete(path); return n; });
        setFileInfos(prev => prev.filter(f => f.path !== path));
        setPreviewResults(prev => prev.filter(r => r.oldPath !== path));
        setExecResults(prev => prev.filter(r => r.oldPath !== path));
    };

    const clearBatch = () => {
        setSelectedPaths(new Set()); setFileInfos([]); setPreviewResults([]); setExecResults([]);
    };

    const updateRule = (id: string, patch: Partial<Rule>) => setRules(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
    const removeRule = (id: string) => setRules(rs => rs.filter(r => r.id !== id));

    const applyPreview = async () => {
        if (!fileInfos.length) return;
        setIsLoading(true);
        try {
            const res = await PreviewRename(fileInfos.map(f => f.path), rules);
            setPreviewResults(res ?? []);
        } finally { setIsLoading(false); }
    };

    const executeAll = async () => {
        if (!fileInfos.length) return;
        setIsExecuting(true);
        try {
            const filePaths = fileInfos.map(f => f.path);
            const enabledRules = rules.filter(r => r.enabled);
            if (enabledRules.length > 0) {
                const results = (await BatchRename(filePaths, enabledRules)) ?? [];
                setExecResults(results);
                setPreviewResults([]);
                const updated = await GetFileInfos(results.map(r => r.newPath).filter(Boolean));
                if (updated?.length) setFileInfos(updated);
            }
        } finally { setIsExecuting(false); }
    };

    const executeResize = async () => {
        setIsResizing(true);
        try {
            const filePaths = fileInfos.map(f => f.path);
            const resizeConf = {
                width: resize.width,
                height: resize.height,
                keepAspect: resize.keepAspect,
                quality: resize.quality,
                outputFormat: resize.format === 'same' ? '' : resize.format,
                resizeMode: resize.resizeMode,
                outputDir: resize.outputDir,
                overwrite: resize.overwrite,
            };
            const results = (await ResizeImagesOnly(filePaths, resizeConf)) ?? [];
            setResizeResults(results);
        } finally { setIsResizing(false); }
    };

    const getPreview = (path: string) => {
        return execResults.find(r => r.oldPath === path) ?? previewResults.find(r => r.oldPath === path) ?? null;
    };

    return (
        <div className="app-shell">
            {/* ── Sidebar: Logo + File Explorer ── */}
            <aside className="sidebar">
                <div className="logo-wrap">
                    <span className="logo-icon">✦</span>
                    <div>
                        <h1 className="logo-title">Renovo</h1>
                        <p className="logo-sub">Premium Processor</p>
                    </div>
                </div>
                <FileExplorer selectedPaths={selectedPaths} onToggleFile={toggleFile} onAddAll={addAll} />
            </aside>

            {/* ── Main Workspace ── */}
            <main className="workspace">
                <header className="workspace-header">
                    <div>
                        <h2 className="workspace-title">File Batch</h2>
                        <p className="workspace-sub">{fileInfos.length > 0 ? `${fileInfos.length} files queued` : 'Select files from the explorer on the left'}</p>
                    </div>
                    {fileInfos.length > 0 && (
                        <button className="btn-ghost" onClick={clearBatch}><Trash2 size={14} /> Clear All</button>
                    )}
                </header>

                <div className="table-wrap">
                    {fileInfos.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon"><Files size={36} /></div>
                            <p className="empty-title">No files queued</p>
                            <p className="empty-sub">Browse and check files in the left panel</p>
                        </div>
                    ) : (
                        <table className="file-table">
                            <thead>
                                <tr>
                                    <th className="col-icon" />
                                    <th>Filename (Original)</th>
                                    <th>Status</th>
                                    <th><div className="flex-center"><ChevronRight size={12} />&nbsp;New Filename</div></th>
                                    <th>Type</th>
                                    <th>Size</th>
                                    <th className="col-action" />
                                </tr>
                            </thead>
                            <tbody>
                                {fileInfos.map(f => {
                                    const preview = getPreview(f.path);
                                    const changed = preview && preview.newName !== f.name;
                                    const hasError = preview?.status === 'error';
                                    const isDone = preview?.status === 'success';
                                    return (
                                        <tr key={f.path} className={`file-row ${hasError ? 'row-error' : isDone ? 'row-done' : ''}`}>
                                            <td className="col-icon">{getFileIcon(f.ext)}</td>
                                            <td className="col-name" title={f.path}>{f.name}</td>
                                            <td className="col-status">
                                                {hasError ? <span title={preview?.error ?? ''}><AlertCircle size={15} className="icon-error" /></span> :
                                                    isDone ? <CheckCircle2 size={15} className="icon-done" /> :
                                                        preview ? <Eye size={15} className="icon-preview" /> :
                                                            <span className="badge badge-ready">Ready</span>}
                                            </td>
                                            <td className="col-new">
                                                {changed ? <span className="new-name">{preview?.newName}</span> : <span className="same-name">{f.name}</span>}
                                            </td>
                                            <td><span className={`badge ${extBadge(f.ext)}`}>{f.ext.replace('.', '').toUpperCase() || '—'}</span></td>
                                            <td className="col-size">{f.sizeLabel}</td>
                                            <td className="col-action">
                                                <button className="btn-icon-ghost row-remove" onClick={() => removeFromBatch(f.path)} title="Remove"><X size={13} /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {/* ── Rules Pane ── */}
            <aside className="rules-pane">
                <div className="pane-section-header"><Wand2 size={15} /><span>Renaming Rules</span></div>

                <div className="rules-list">
                    {rules.map(rule => (
                        <RuleCard key={rule.id} rule={rule} onChange={p => updateRule(rule.id, p)} onRemove={() => removeRule(rule.id)} />
                    ))}
                </div>

                <div className="add-rule-row">
                    {(['replace', 'affixes', 'case', 'sequence'] as RuleType[]).map(t => (
                        <button key={t} className="btn-add-rule" onClick={() => setRules(rs => [...rs, mkRule(t)])}>
                            {t === 'replace' ? <ArrowLeftRight size={12} /> : t === 'affixes' ? <Hash size={12} /> : t === 'case' ? <Type size={12} /> : <ListOrdered size={12} />}
                            {t === 'replace' ? 'Replace' : t === 'affixes' ? 'Affix' : t === 'case' ? 'Case' : 'Sequence'}
                        </button>
                    ))}
                </div>

                <hr className="pane-divider" />
                <div className="pane-section-header"><SlidersHorizontal size={15} /><span>Image Processing</span></div>

                {resize.enabled && imageCount === 0 && (
                    <div className="resize-warning">
                        <AlertCircle size={13} /> No images in queue
                    </div>
                )}

                <div className={`rule-card ${resize.enabled ? 'rule-card-active' : ''}`}>
                    <div className="rule-header">
                        <div className="rule-icon"><RefreshCw size={14} /></div>
                        <span className="rule-label">Image Resize</span>
                        <label className="toggle" style={{ marginLeft: 'auto' }}>
                            <input type="checkbox" checked={resize.enabled} onChange={e => setResize(r => ({ ...r, enabled: e.target.checked }))} />
                            <span className="toggle-track" />
                        </label>
                    </div>
                    {resize.enabled && (
                        <div className="rule-body">
                            {/* Mode selector */}
                            <div className="seg-control">
                                {(['fit', 'fill', 'exact'] as const).map(m => (
                                    <button key={m} className={`seg-btn ${resize.resizeMode === m ? 'seg-active' : ''}`}
                                        onClick={() => setResize(r => ({ ...r, resizeMode: m }))}>
                                        {m === 'fit' ? 'Fit' : m === 'fill' ? 'Fill' : 'Exact'}
                                    </button>
                                ))}
                            </div>
                            <p className="resize-mode-hint">
                                {resize.resizeMode === 'fit' ? 'Scale to fit within box, keep ratio' :
                                    resize.resizeMode === 'fill' ? 'Crop from center to exact size' :
                                        'Stretch to exact size, ignore ratio'}
                            </p>

                            {/* Dimensions */}
                            <div className="resize-dims-linked" style={{ marginTop: '10px' }}>
                                <div className="field-group">
                                    <label>Width (px)</label>
                                    <input type="number" min={0} placeholder="Auto"
                                        value={resize.width || ''}
                                        onChange={e => {
                                            const w = Math.max(0, +e.target.value);
                                            setResize(r => {
                                                let h = r.height;
                                                if (r.keepAspect && w > 0 && r.width > 0) {
                                                    h = Math.round(w * (r.height / r.width));
                                                }
                                                return { ...r, width: w, height: h };
                                            });
                                        }} className="rule-input" />
                                </div>

                                <button
                                    className={`btn-lock ${resize.keepAspect ? 'btn-lock-active' : ''}`}
                                    onClick={() => setResize(r => ({ ...r, keepAspect: !r.keepAspect }))}
                                    title={resize.keepAspect ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                                >
                                    <Link size={14} />
                                </button>

                                <div className="field-group">
                                    <label>Height (px)</label>
                                    <input type="number" min={0} placeholder="Auto"
                                        value={resize.height || ''}
                                        onChange={e => {
                                            const h = Math.max(0, +e.target.value);
                                            setResize(r => {
                                                let w = r.width;
                                                if (r.keepAspect && h > 0 && r.height > 0) {
                                                    w = Math.round(h * (r.width / r.height));
                                                }
                                                return { ...r, height: h, width: w };
                                            });
                                        }} className="rule-input" />
                                </div>
                            </div>

                            {/* Output format */}
                            <div className="field-row" style={{ marginTop: '8px' }}>
                                <label>Format</label>
                                <select value={resize.format} onChange={e => setResize(r => ({ ...r, format: e.target.value }))} className="rule-select">
                                    <option value="same">Keep original</option>
                                    <option value="jpeg">→ JPEG</option>
                                    <option value="png">→ PNG</option>
                                </select>
                            </div>

                            {/* Quality — only for JPEG */}
                            {resize.format !== 'png' && (
                                <div className="quality-row" style={{ marginTop: '6px' }}>
                                    <label>Quality {resize.quality}%</label>
                                    <input type="range" min={10} max={100} value={resize.quality}
                                        onChange={e => setResize(r => ({ ...r, quality: +e.target.value }))} className="slider" />
                                </div>
                            )}

                            {/* Overwrite / Output dir */}
                            <div className="field-row" style={{ marginTop: '8px' }}>
                                <label className="toggle-label">
                                    <input type="checkbox" checked={resize.overwrite}
                                        onChange={e => setResize(r => ({ ...r, overwrite: e.target.checked }))} />
                                    <span>Overwrite originals</span>
                                </label>
                            </div>

                            {!resize.overwrite && (
                                <div className="outdir-row" style={{ marginTop: '6px' }}>
                                    <span className="outdir-path" title={resize.outputDir}>
                                        {resize.outputDir ? resize.outputDir.split('/').slice(-2).join('/') : 'Beside original (_resized)'}
                                    </span>
                                    <button className="btn-outdir" onClick={async () => {
                                        const dir = await SelectDirectory();
                                        if (dir) setResize(r => ({ ...r, outputDir: dir }));
                                    }}>Browse…</button>
                                </div>
                            )}

                            {/* Resize-only execute */}
                            <button className="btn-resize-only" onClick={executeResize} disabled={isResizing || imageCount === 0}>
                                {isResizing ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
                                {isResizing ? 'Resizing…' : `Resize ${imageCount} image${imageCount !== 1 ? 's' : ''}`}
                            </button>

                            {/* Results summary row */}
                            {resizeResults.length > 0 && (
                                <div className="resize-done-row">
                                    <CheckCircle2 size={13} className="icon-done" />
                                    <span>{resizeResults.filter(r => r.status === 'success').length} resized · {resizeResults.filter(r => r.status === 'error').length} errors</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <hr className="pane-divider" />
                <div className="summary-grid">
                    <div className="summary-item"><span className="sum-val">{fileInfos.length}</span><span className="sum-lbl">Files</span></div>
                    <div className="summary-item"><span className="sum-val">{jpgCount}</span><span className="sum-lbl">JPEG</span></div>
                    <div className="summary-item"><span className="sum-val">{pngCount}</span><span className="sum-lbl">PNG</span></div>
                </div>

                <div className="action-buttons">
                    <button className="btn-preview" onClick={applyPreview} disabled={isLoading || !fileInfos.length}>
                        {isLoading ? <Loader2 size={15} className="spin" /> : <Eye size={15} />} Preview Changes
                    </button>
                    <button className="btn-execute" onClick={executeAll} disabled={isExecuting || !fileInfos.length}>
                        {isExecuting ? <Loader2 size={15} className="spin" /> : <Play size={15} fill="currentColor" />} Rename &amp; Resize
                    </button>
                    <button className="btn-clear" onClick={clearBatch}>Clear Queue</button>
                </div>
            </aside>
        </div>
    );
}
