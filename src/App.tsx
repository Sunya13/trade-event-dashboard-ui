import { useEffect, useState } from 'react';
import { fetchTrades } from './api';
import type { Trade } from './models';

function App() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTrades();
        setTrades(data);
      } catch (e) {
        console.error("Failed to fetch trades", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Format time
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString();
  };

  // Helper for badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-success';
      case 'CANCELLED': return 'bg-danger';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="container mt-4">
      {/* Header */}
      <nav className="navbar navbar-dark bg-dark mb-4 rounded shadow-sm p-3">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">
            <i className="bi bi-graph-up-arrow me-2"></i>
            SimpleTrade <small className="text-secondary fs-6 ms-2">Cloudflare UI</small>
          </span>
          <button className="btn btn-success btn-sm">
            <i className="bi bi-plus-circle me-1"></i> New Booking
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0 text-secondary">Trade Blotter (Mock Data)</h5>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light small text-uppercase text-secondary">
                <tr>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Ref</th>
                  <th>Subject</th>
                  <th>Source</th>
                  <th>Counterparty</th>
                  <th className="text-end">Notional</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.tradeRef} className={t.status === 'CANCELLED' ? 'text-decoration-line-through text-muted' : ''}>
                    <td>
                      <span className={`badge ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{formatTime(t.updatedAt)}</td>
                    <td className="fw-bold font-monospace text-dark">
                      {t.status === 'CANCELLED' ? <span className="text-muted">{t.tradeRef}</span> : t.tradeRef}
                    </td>
                    <td>{t.subject}</td>
                    <td>{t.source}</td>
                    <td>{t.counterparty}</td>
                    <td className="text-end font-monospace">{formatCurrency(t.notional)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;