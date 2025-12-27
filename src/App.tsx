import { useEffect, useState, useMemo } from 'react';
import { fetchTrades, updateTradeStatus, bookTrade, amendTrade } from './api';
import type { Trade } from './models';

// --- Types ---
type SortConfig = { key: keyof Trade | 'updatedAt'; direction: 'asc' | 'desc' };
type ToastMsg = { id: number; msg: string; type: 'success' | 'error' | 'info' };

function App() {
  // Data State
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // UI State
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'LIVE' | 'VERIFIED' | 'CANCELLED'>('ALL');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'updatedAt', direction: 'desc' });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isAmendMode, setIsAmendMode] = useState(false);
  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [formData, setFormData] = useState({ subject: 'VANILLA_SWAPTION', source: 'INTERNAL_UI', counterparty: '', notional: 0 });

  // --- Effects ---
  useEffect(() => {
    loadData();
    // Apply Dark Mode to body
    document.documentElement.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchTrades();
    setTrades(data);
    setLoading(false);
  };

  // --- Toast Logic ---
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // --- KPI Calculations ---
  const kpiData = useMemo(() => {
    return {
      total: trades.length,
      exposure: trades.filter(t => t.status === 'LIVE').reduce((sum, t) => sum + t.notional, 0),
      pending: trades.filter(t => t.status === 'LIVE').length
    };
  }, [trades]);

  // --- Filtering & Sorting ---
  const processedTrades = useMemo(() => {
    let result = [...trades];

    // Filter by Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.tradeRef.toLowerCase().includes(lower) ||
        t.counterparty.toLowerCase().includes(lower) ||
        t.subject.toLowerCase().includes(lower)
      );
    }

    // Filter by Status
    if (filterStatus !== 'ALL') {
      result = result.filter(t => t.status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [trades, searchTerm, filterStatus, sortConfig]);

  const handleSort = (key: keyof Trade | 'updatedAt') => {
    setSortConfig(curr => ({
      key,
      direction: curr.key === key && curr.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // --- Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAmendMode && editingRef) {
        await amendTrade(editingRef, formData);
        showToast('Trade Amended Successfully');
    } else {
        await bookTrade(formData);
        showToast('Trade Booked Successfully');
    }
    setShowForm(false);
    loadData();
  };

  const handleExport = () => {
    const headers = ["Ref,Status,Subject,Counterparty,Notional,Updated"];
    const rows = trades.map(t => `${t.tradeRef},${t.status},${t.subject},${t.counterparty},${t.notional},${t.updatedAt}`);
    const blob = new Blob([headers.concat(rows).join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showToast('Export downloaded', 'info');
  };

  const handleAction = async (ref: string, action: 'VERIFY' | 'CANCEL') => {
    if(!confirm(`Are you sure you want to ${action} this trade?`)) return;
    await updateTradeStatus(ref, action === 'VERIFY' ? 'VERIFIED' : 'CANCELLED');
    showToast(`Trade ${action === 'VERIFY' ? 'Verified' : 'Cancelled'}`, action === 'VERIFY' ? 'success' : 'error');
    loadData();
  };

  const openForm = (trade?: Trade) => {
    if (trade) {
      setIsAmendMode(true);
      setEditingRef(trade.tradeRef);
      setFormData({ subject: trade.subject, source: trade.source, counterparty: trade.counterparty, notional: trade.notional });
    } else {
      setIsAmendMode(false);
      setEditingRef(null);
      setFormData({ subject: 'VANILLA_SWAPTION', source: 'INTERNAL_UI', counterparty: '', notional: 0 });
    }
    setShowForm(true);
  };

  // --- Helper Components ---
  const SkeletonRow = () => (
    <tr>
      <td colSpan={7}>
        <div className="placeholder-glow">
          <span className="placeholder col-12 bg-secondary bg-opacity-25 py-3 rounded"></span>
        </div>
      </td>
    </tr>
  );

  return (
    <div className={`min-vh-100 ${darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}`}>

      {/* Toast Container */}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1100 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast show align-items-center text-white bg-${t.type === 'error' ? 'danger' : (t.type === 'info' ? 'info' : 'success')} border-0 mb-2`} role="alert">
            <div className="d-flex">
              <div className="toast-body">{t.msg}</div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}></button>
            </div>
          </div>
        ))}
      </div>

      {/* Navbar */}
      <nav className={`navbar navbar-expand-lg ${darkMode ? 'navbar-dark bg-secondary' : 'navbar-dark bg-dark'} shadow-sm mb-4`}>
        <div className="container-fluid">
          <span className="navbar-brand fw-bold"><i className="bi bi-graph-up-arrow me-2"></i>SimpleTrade Pro</span>
          <div className="d-flex align-items-center gap-3">
             <div className="form-check form-switch text-white">
                <input className="form-check-input" type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                <label className="form-check-label"><i className={`bi ${darkMode ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`}></i></label>
             </div>
             <button className="btn btn-outline-light btn-sm" onClick={handleExport}><i className="bi bi-download me-1"></i> Export</button>
             <button className="btn btn-success btn-sm fw-bold" onClick={() => openForm()}><i className="bi bi-plus-lg me-1"></i> New Trade</button>
          </div>
        </div>
      </nav>

      <div className="container pb-5">

        {/* KPI Cards */}
        <div className="row g-3 mb-4">
            <div className="col-md-4">
                <div className={`card border-0 shadow-sm ${darkMode ? 'bg-secondary bg-opacity-25' : ''}`}>
                    <div className="card-body">
                        <h6 className="text-muted text-uppercase small">Total Volume</h6>
                        <h3 className="fw-bold">{kpiData.total} <small className="fs-6 text-success"><i className="bi bi-arrow-up"></i></small></h3>
                    </div>
                </div>
            </div>
            <div className="col-md-4">
                <div className={`card border-0 shadow-sm ${darkMode ? 'bg-secondary bg-opacity-25' : ''}`}>
                    <div className="card-body">
                        <h6 className="text-muted text-uppercase small">Live Exposure</h6>
                        <h3 className="fw-bold">${kpiData.exposure.toLocaleString()}</h3>
                    </div>
                </div>
            </div>
            <div className="col-md-4">
                <div className={`card border-0 shadow-sm ${darkMode ? 'bg-secondary bg-opacity-25' : ''}`}>
                    <div className="card-body">
                        <h6 className="text-muted text-uppercase small">Pending Verification</h6>
                        <h3 className="fw-bold text-warning">{kpiData.pending}</h3>
                    </div>
                </div>
            </div>
        </div>

        {/* Filters */}
        <div className="row g-2 mb-3 align-items-center">
            <div className="col-md-6">
                <div className="input-group">
                    <span className={`input-group-text ${darkMode ? 'bg-secondary border-secondary text-white' : 'bg-white'}`}><i className="bi bi-search"></i></span>
                    <input type="text" className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                           placeholder="Search Ref, Counterparty..."
                           value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>
            <div className="col-md-6 text-end">
                <div className="btn-group" role="group">
                    {['ALL', 'LIVE', 'VERIFIED', 'CANCELLED'].map(status => (
                        <button key={status}
                                className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : (darkMode ? 'btn-outline-light' : 'btn-outline-secondary')}`}
                                onClick={() => setFilterStatus(status as any)}>
                            {status}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Booking Form Overlay */}
        {showForm && (
            <div className="card mb-4 shadow-lg border-0 animate__animated animate__fadeIn">
                <div className={`card-header text-white ${isAmendMode ? 'bg-warning' : 'bg-primary'}`}>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{isAmendMode ? 'Amend Trade' : 'New Booking'}</h5>
                        <button className="btn-close btn-close-white" onClick={() => setShowForm(false)}></button>
                    </div>
                </div>
                <div className={`card-body ${darkMode ? 'bg-secondary bg-opacity-10' : ''}`}>
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Subject</label>
                                <select className="form-select" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
                                    <option value="VANILLA_SWAPTION">Vanilla Swaption</option>
                                    <option value="FX_OPTION">FX Option</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Source</label>
                                <select className="form-select" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                                    <option value="INTERNAL_UI">Internal UI</option>
                                    <option value="BLOOMBERG">Bloomberg</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Counterparty</label>
                                <input type="text" className="form-control" required value={formData.counterparty} onChange={e => setFormData({...formData, counterparty: e.target.value})} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Notional</label>
                                <input type="number" className="form-control" required value={formData.notional} onChange={e => setFormData({...formData, notional: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div className="mt-3 text-end">
                            <button type="submit" className={`btn ${isAmendMode ? 'btn-warning' : 'btn-primary'} px-4`}>{isAmendMode ? 'Save Changes' : 'Book Trade'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Data Table */}
        <div className={`card shadow-sm border-0 overflow-hidden ${darkMode ? 'bg-dark border-secondary' : ''}`}>
            <div className="table-responsive">
                <table className={`table table-hover mb-0 align-middle ${darkMode ? 'table-dark' : ''}`}>
                    <thead className={darkMode ? 'table-secondary' : 'table-light'}>
                        <tr>
                            <th style={{width: '40px'}}></th>
                            <th onClick={() => handleSort('status')} style={{cursor: 'pointer'}}>Status {sortConfig.key==='status' && <i className={`bi bi-caret-${sortConfig.direction}-fill`}></i>}</th>
                            <th onClick={() => handleSort('updatedAt')} style={{cursor: 'pointer'}}>Updated {sortConfig.key==='updatedAt' && <i className={`bi bi-caret-${sortConfig.direction}-fill`}></i>}</th>
                            <th onClick={() => handleSort('tradeRef')} style={{cursor: 'pointer'}}>Ref {sortConfig.key==='tradeRef' && <i className={`bi bi-caret-${sortConfig.direction}-fill`}></i>}</th>
                            <th>Subject</th>
                            <th>CParty</th>
                            <th className="text-end" onClick={() => handleSort('notional')} style={{cursor: 'pointer'}}>Notional {sortConfig.key==='notional' && <i className={`bi bi-caret-${sortConfig.direction}-fill`}></i>}</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <>
                                <SkeletonRow /><SkeletonRow /><SkeletonRow />
                            </>
                        ) : processedTrades.map(t => (
                            <>
                                <tr key={t.tradeRef} className={t.status === 'CANCELLED' ? 'text-decoration-line-through text-muted' : ''}
                                    onClick={() => setExpandedRow(expandedRow === t.tradeRef ? null : t.tradeRef)}
                                    style={{cursor: 'pointer'}}>
                                    <td className="text-center"><i className={`bi bi-chevron-${expandedRow === t.tradeRef ? 'down' : 'right'} text-muted`}></i></td>
                                    <td><span className={`badge bg-${t.status==='VERIFIED'?'success':(t.status==='CANCELLED'?'danger':'primary')}`}>{t.status}</span></td>
                                    <td>{new Date(t.updatedAt).toLocaleTimeString()}</td>
                                    <td className="fw-bold font-monospace">{t.tradeRef}</td>
                                    <td>{t.subject}</td>
                                    <td>{t.counterparty}</td>
                                    <td className="text-end font-monospace">${t.notional.toLocaleString()}</td>
                                    <td className="text-end" onClick={e => e.stopPropagation()}>
                                        {t.status === 'LIVE' && (
                                            <div className="btn-group">
                                                <button className="btn btn-sm btn-outline-success" title="Verify" onClick={() => handleAction(t.tradeRef, 'VERIFY')}><i className="bi bi-check-lg"></i></button>
                                                <button className="btn btn-sm btn-outline-warning" title="Amend" onClick={() => openForm(t)}><i className="bi bi-pencil"></i></button>
                                                <button className="btn btn-sm btn-outline-danger" title="Cancel" onClick={() => handleAction(t.tradeRef, 'CANCEL')}><i className="bi bi-x-lg"></i></button>
                                            </div>
                                        )}
                                        {t.status !== 'LIVE' && <span className="badge bg-secondary">LOCKED</span>}
                                    </td>
                                </tr>
                                {/* Expanded History Row */}
                                {expandedRow === t.tradeRef && (
                                    <tr className={darkMode ? 'bg-secondary bg-opacity-10' : 'bg-light'}>
                                        <td colSpan={8} className="p-3">
                                            <h6 className="small text-muted text-uppercase fw-bold mb-2">Audit Trail</h6>
                                            <table className="table table-sm table-borderless mb-0 small">
                                                <thead><tr><th>Time</th><th>Action</th><th>User</th><th>Note</th></tr></thead>
                                                <tbody>
                                                    {t.history?.map((h, i) => (
                                                        <tr key={i}>
                                                            <td className="text-muted">{new Date(h.timestamp).toLocaleString()}</td>
                                                            <td><span className="badge bg-secondary">{h.action}</span></td>
                                                            <td>{h.user}</td>
                                                            <td className="fst-italic">{h.note}</td>
                                                        </tr>
                                                    ))}
                                                    {!t.history?.length && <tr><td colSpan={4}>No history available</td></tr>}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
                {!loading && processedTrades.length === 0 && (
                    <div className="text-center py-5 text-muted">
                        <i className="bi bi-search fs-1"></i>
                        <p className="mt-2">No trades found matching your filters.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;