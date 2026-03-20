import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://api.brgybiluso.me/api/pdf';
const QUEUE_API_URL = 'https://api.brgybiluso.me/api/queue';
const QUEUE_WS_URL = 'wss://api.brgybiluso.me';

const TYPE_LABELS = {
  'BRGY-CLR': 'Barangay Clearance',
  'BRGY-BLD': 'Barangay Building Clearance',
  'BRGY-BP': 'Barangay Building Permit',
  'BRGY-IND': 'Barangay Indigency',
  'BRGY-RES': 'Barangay Residency',
  'BRGY-WP': 'Barangay Work Permit',
  'GMC': 'Good Moral Character',
  'FTJSC': 'First-Time Job Seeker',
};

const STATUS_OPTIONS = ['Pending', 'Processing', 'For Pick-up', 'Completed', 'Cancelled'];

const parseTimestamp = (value) => {
  if (!value) return NaN;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : NaN;
};

const getDocumentTimestamp = (pdf) => {
  const candidates = [
    pdf?.createdTime,
    pdf?.appProperties?.createdAt,
    pdf?.modifiedTime,
    pdf?.appProperties?.updatedAt,
  ];

  for (const candidate of candidates) {
    const ts = parseTimestamp(candidate);
    if (Number.isFinite(ts)) return ts;
  }

  return 0;
};

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pdfs, setPdfs] = useState([]);
  const [trash, setTrash] = useState([]);
  const [loadingPdfs, setLoadingPdfs] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [activeTab, setActiveTab] = useState('documents');
  const [trashSelectedIds, setTrashSelectedIds] = useState(new Set());

  const [queueSnapshot, setQueueSnapshot] = useState({ nowServing: [], forPickup: [] });
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueConnected, setQueueConnected] = useState(false);
  const [assistanceToast, setAssistanceToast] = useState('');

  const selectAllCheckbox = useRef(null);
  const trashSelectAllCheckbox = useRef(null);
  const queueSocketRef = useRef(null);
  const queueReconnectTimerRef = useRef(null);
  const assistanceToastTimerRef = useRef(null);

  useEffect(() => {
    checkAuthStatus();

    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      setSuccessMessage('Authentication successful!');
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadPdfs();
      loadTrash();
      loadQueueSnapshot();
    }
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) {
      disconnectQueueSocket();
      return;
    }

    connectQueueSocket();
    return () => disconnectQueueSocket();
  }, [authenticated]);

  const connectQueueSocket = () => {
    disconnectQueueSocket();

    try {
      const ws = new WebSocket(QUEUE_WS_URL);
      queueSocketRef.current = ws;

      ws.onopen = () => {
        setQueueConnected(true);
        ws.send(JSON.stringify({ type: 'subscribe-queue' }));
        ws.send(JSON.stringify({ type: 'subscribe-assistance' }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'queue-update' && msg.payload) {
            setQueueSnapshot({
              nowServing: msg.payload.nowServing || [],
              forPickup: msg.payload.forPickup || [],
            });
          }

          if (msg.type === 'assistance-alert' && msg.payload) {
            const name = msg.payload.fullName || 'Walk-in user';
            const document = msg.payload.document ? ` (${msg.payload.document})` : '';
            const reference = msg.payload.referenceNumber ? ` [${msg.payload.referenceNumber}]` : '';
            setAssistanceToast(`Assistance requested by ${name}${document}${reference}`);

            if (assistanceToastTimerRef.current) {
              clearTimeout(assistanceToastTimerRef.current);
            }

            assistanceToastTimerRef.current = setTimeout(() => {
              setAssistanceToast('');
              assistanceToastTimerRef.current = null;
            }, 8000);
          }
        } catch (parseErr) {
          console.error('Queue WS parse error:', parseErr);
        }
      };

      ws.onclose = () => {
        setQueueConnected(false);
        if (authenticated) {
          queueReconnectTimerRef.current = setTimeout(() => {
            connectQueueSocket();
          }, 3000);
        }
      };

      ws.onerror = (wsErr) => {
        console.error('Queue WS error:', wsErr);
      };
    } catch (err) {
      console.error('Failed to initialize queue socket:', err);
    }
  };

  const disconnectQueueSocket = () => {
    if (queueReconnectTimerRef.current) {
      clearTimeout(queueReconnectTimerRef.current);
      queueReconnectTimerRef.current = null;
    }

    if (queueSocketRef.current) {
      try {
        if (queueSocketRef.current.readyState === WebSocket.OPEN) {
          queueSocketRef.current.send(JSON.stringify({ type: 'unsubscribe-assistance' }));
        }
        queueSocketRef.current.close();
      } catch (err) {
        console.error('Error closing queue socket:', err);
      }
      queueSocketRef.current = null;
    }

    setQueueConnected(false);

    if (assistanceToastTimerRef.current) {
      clearTimeout(assistanceToastTimerRef.current);
      assistanceToastTimerRef.current = null;
    }
  };

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/check`);
      setAuthenticated(response.data.authenticated);
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Failed to check authentication status');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const loadPdfs = async () => {
    try {
      setLoadingPdfs(true);
      setError('');
      const response = await axios.get(`${API_URL}/list`);
      setPdfs(response.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthenticated(false);
      } else {
        setError('Failed to load PDFs: ' + (err.response?.data?.error || err.message));
      }
      setPdfs([]);
    } finally {
      setLoadingPdfs(false);
    }
  };

  const loadTrash = async () => {
    try {
      const response = await axios.get(`${API_URL}/trash`);
      setTrash(response.data || []);
    } catch (err) {
      console.error('Failed to load trash:', err);
      setTrash([]);
    }
  };

  const loadQueueSnapshot = async () => {
    try {
      setQueueLoading(true);
      const response = await axios.get(QUEUE_API_URL);
      setQueueSnapshot({
        nowServing: response.data?.nowServing || [],
        forPickup: response.data?.forPickup || [],
      });
    } catch (err) {
      console.error('Failed to load queue snapshot:', err);
      setQueueSnapshot({ nowServing: [], forPickup: [] });
    } finally {
      setQueueLoading(false);
    }
  };

  const availableTypes = useMemo(() => {
    const set = new Set();
    (pdfs || []).forEach((p) => {
      const code = p.appProperties?.type;
      if (code) set.add(code);
    });
    return Array.from(set).sort();
  }, [pdfs]);

  const typeCount = useMemo(() => {
    const counts = {};
    (pdfs || []).forEach((p) => {
      const code = p.appProperties?.type;
      if (code) counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  }, [pdfs]);

  const statusCount = useMemo(() => {
    const counts = {};
    (pdfs || []).forEach((p) => {
      const status = p.appProperties?.status || 'Pending';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [pdfs]);

  const visiblePdfs = useMemo(() => {
    let items = Array.isArray(pdfs) ? [...pdfs] : [];

    if (typeFilter !== 'all') {
      items = items.filter((p) => (p.appProperties?.type || '') === typeFilter);
    }

    if (statusFilter !== 'all') {
      items = items.filter((p) => (p.appProperties?.status || 'Pending') === statusFilter);
    }

    if (userFilter !== 'all') {
      items = items.filter(() => true);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      items = items.filter((p) => new Date(p.createdTime) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      items = items.filter((p) => new Date(p.createdTime) <= to);
    }

    items.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = getDocumentTimestamp(a) - getDocumentTimestamp(b);
      } else if (sortBy === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'size') {
        cmp = (a.size || 0) - (b.size || 0);
      }

      // Keep ordering deterministic when primary sort value is equal.
      if (cmp === 0) {
        cmp = (a.name || '').localeCompare(b.name || '');
      }
      if (cmp === 0) {
        cmp = (a.appProperties?.referenceNumber || '').localeCompare(b.appProperties?.referenceNumber || '');
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    const q = query.trim().toLowerCase();
    if (q) {
      items = items.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const code = p.appProperties?.type || '';
        const label = (TYPE_LABELS[code] || code).toLowerCase();
        const referenceNumber = (p.appProperties?.referenceNumber || '').toLowerCase();
        return name.includes(q) || label.includes(q) || referenceNumber.includes(q);
      });
    }

    return items;
  }, [pdfs, typeFilter, statusFilter, userFilter, dateFrom, dateTo, sortBy, sortDir, query]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, dateFrom, dateTo, sortBy, sortDir, query]);

  const totalItems = visiblePdfs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedPdfs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return visiblePdfs.slice(start, start + pageSize);
  }, [visiblePdfs, page, pageSize]);

  const orderedNowServing = useMemo(() => {
    return [...(queueSnapshot.nowServing || [])].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return String(a.referenceNumber || '').localeCompare(String(b.referenceNumber || ''));
    });
  }, [queueSnapshot.nowServing]);

  const orderedForPickup = useMemo(() => {
    return [...(queueSnapshot.forPickup || [])].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return String(a.referenceNumber || '').localeCompare(String(b.referenceNumber || ''));
    });
  }, [queueSnapshot.forPickup]);

  const splitIntoTwoColumns = (items) => {
    const midpoint = Math.ceil(items.length / 2);
    return [items.slice(0, midpoint), items.slice(midpoint)];
  };

  const renderQueueCards = (items, prefix) => {
    const shouldSplit = items.length >= 10;
    const [leftItems, rightItems] = splitIntoTwoColumns(items);
    const visibleLeftItems = shouldSplit ? leftItems : items;
    const densityClass = shouldSplit ? 'queue-card--dense' : items.length <= 4 ? 'queue-card--hero' : items.length <= 7 ? 'queue-card--roomy' : 'queue-card--normal';
    return (
      <div className={`queue-list ${shouldSplit ? 'queue-list-columns' : ''}`}>
        <div className="queue-sublist">
          {visibleLeftItems.map((item) => (
            <div className={`queue-card ${densityClass}`} key={`${prefix}-${item.referenceNumber}`}>
              <div className="queue-card-head">
                <strong>{item.referenceNumber}</strong>
                <span>{item.document || '-'}</span>
              </div>
              <div className="queue-card-row">
                <span>{item.fullName || '-'}</span>
                <select
                  className="status-select"
                  value={item.status}
                  onChange={(e) => updateQueueStatus(item.referenceNumber, e.target.value)}
                  disabled={updatingStatusId === `ref-${item.referenceNumber}`}
                >
                  {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
        {shouldSplit && (
          <div className="queue-sublist">
            {rightItems.map((item) => (
              <div className={`queue-card ${densityClass}`} key={`${prefix}-2-${item.referenceNumber}`}>
                <div className="queue-card-head">
                  <strong>{item.referenceNumber}</strong>
                  <span>{item.document || '-'}</span>
                </div>
                <div className="queue-card-row">
                  <span>{item.fullName || '-'}</span>
                  <select
                    className="status-select"
                    value={item.status}
                    onChange={(e) => updateQueueStatus(item.referenceNumber, e.target.value)}
                    disabled={updatingStatusId === `ref-${item.referenceNumber}`}
                  >
                    {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const initiateAuth = async () => {
    try {
      setError('');
      const response = await axios.get(`${API_URL}/auth/init`);
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      setError('Failed to initiate authentication: ' + err.message);
    }
  };

  const logout = async () => {
    try {
      setError('');
      await axios.post(`${API_URL}/auth/logout`);
      setAuthenticated(false);
      setPdfs([]);
      setQueueSnapshot({ nowServing: [], forPickup: [] });
      setSuccessMessage('Logged out successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to logout: ' + err.message);
    }
  };

  const updateStatusByFileId = async (fileId, newStatus) => {
    setUpdatingStatusId(fileId);
    const response = await axios.patch(`${API_URL}/status/${fileId}`, { status: newStatus });

    setPdfs((prev) => prev.map((pdf) => {
      if (pdf.id !== fileId) return pdf;
      return {
        ...pdf,
        appProperties: {
          ...pdf.appProperties,
          status: newStatus,
        },
      };
    }));

    return response.data;
  };

  const updateStatusByReference = async (referenceNumber, newStatus) => {
    const key = `ref-${referenceNumber}`;
    setUpdatingStatusId(key);

    const response = await axios.patch(`${API_URL}/status/ref/${referenceNumber}`, { status: newStatus });

    setPdfs((prev) => prev.map((pdf) => {
      if (pdf.appProperties?.referenceNumber !== referenceNumber) return pdf;
      return {
        ...pdf,
        appProperties: {
          ...pdf.appProperties,
          status: newStatus,
        },
      };
    }));

    return response.data;
  };

  const updateStatus = async (fileId, newStatus) => {
    try {
      setError('');
      await updateStatusByFileId(fileId, newStatus);
      setSuccessMessage('Status updated successfully');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError('Failed to update status: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const updateQueueStatus = async (referenceNumber, newStatus) => {
    try {
      setError('');
      await updateStatusByReference(referenceNumber, newStatus);
      setSuccessMessage(`Queue item ${referenceNumber} updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(''), 2000);
      loadQueueSnapshot();
    } catch (err) {
      setError('Failed to update queue status: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const markAsProcessingIfNeeded = async (pdf) => {
    const currentStatus = pdf.appProperties?.status || 'Pending';
    if (currentStatus === 'Processing') return;
    await updateStatusByFileId(pdf.id, 'Processing');
  };

  const handleViewPdf = async (pdf) => {
    try {
      setError('');
      await markAsProcessingIfNeeded(pdf);
    } catch (err) {
      console.error('Failed to auto-set processing on view:', err.message);
    } finally {
      window.open(pdf.webViewLink, '_blank', 'noopener,noreferrer');
    }
  };

  const downloadPdf = async (pdf) => {
    try {
      setError('');
      await markAsProcessingIfNeeded(pdf);

      const response = await axios.get(`${API_URL}/download/${pdf.id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', pdf.name || 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download PDF: ' + (err.response?.data?.error || err.message));
    }
  };

  const deletePdf = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      setError('');
      setDeletingId(fileId);
      await axios.delete(`${API_URL}/delete/${fileId}`);
      setPdfs((prev) => prev.filter((pdf) => pdf.id !== fileId));
      setSuccessMessage('PDF deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete PDF: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelectPdf = (fileId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedIds(newSelected);
  };

  const selectAllVisible = () => {
    if (selectedIds.size === pagedPdfs.length && pagedPdfs.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedPdfs.map((p) => p.id)));
    }
  };

  useEffect(() => {
    if (selectAllCheckbox.current) {
      selectAllCheckbox.current.indeterminate = selectedIds.size > 0 && selectedIds.size < pagedPdfs.length;
    }
  }, [selectedIds.size, pagedPdfs.length]);

  const deleteMultiple = async () => {
    if (selectedIds.size === 0) {
      setError('Please select at least one document to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} document(s)?`)) {
      return;
    }

    try {
      setError('');
      setDeletingId('multi');
      const fileIds = Array.from(selectedIds);
      await axios.delete(`${API_URL}/delete-multiple`, { data: { fileIds } });
      setPdfs((prev) => prev.filter((pdf) => !selectedIds.has(pdf.id)));
      setSelectedIds(new Set());
      setSuccessMessage(`${fileIds.length} PDF(s) deleted successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete PDFs: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const permanentlyDeleteFromTrash = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete "${fileName}"? This cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      setDeletingId(fileId);
      await axios.delete(`${API_URL}/trash/${fileId}`);
      setTrash((prev) => prev.filter((item) => item.id !== fileId));
      setSuccessMessage('File permanently deleted');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to permanently delete file: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const permanentlyDeleteMultipleFromTrash = async () => {
    if (trashSelectedIds.size === 0) {
      setError('Please select at least one file to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${trashSelectedIds.size} file(s)? This cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      setDeletingId('trash-multi');
      const fileIds = Array.from(trashSelectedIds);
      await axios.delete(`${API_URL}/trash-multiple`, { data: { fileIds } });
      setTrash((prev) => prev.filter((item) => !trashSelectedIds.has(item.id)));
      setTrashSelectedIds(new Set());
      setSuccessMessage(`${fileIds.length} file(s) permanently deleted`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to permanently delete files: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const restoreFromTrash = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to restore "${fileName}"?`)) {
      return;
    }

    try {
      setError('');
      setDeletingId(fileId);
      await axios.post(`${API_URL}/restore/${fileId}`);
      setTrash((prev) => prev.filter((item) => item.id !== fileId));
      setSuccessMessage('Document restored successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadPdfs();
    } catch (err) {
      setError('Failed to restore document: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const restoreMultipleFromTrash = async () => {
    if (trashSelectedIds.size === 0) {
      setError('Please select at least one file to restore');
      return;
    }

    try {
      setError('');
      setDeletingId('trash-restore-multi');
      const fileIds = Array.from(trashSelectedIds);
      await axios.post(`${API_URL}/restore-multiple`, { fileIds });
      setTrash((prev) => prev.filter((item) => !trashSelectedIds.has(item.id)));
      setTrashSelectedIds(new Set());
      setSuccessMessage(`${fileIds.length} document(s) restored successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
      loadPdfs();
    } catch (err) {
      setError('Failed to restore documents: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-container loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-brand">
          <h1>Barangay Biluso</h1>
          <span className="header-subtitle">Document Management Dashboard</span>
        </div>
        <div className="auth-status">
          {authenticated ? (
            <button onClick={logout} className="btn btn-logout">Logout</button>
          ) : (
            <button onClick={initiateAuth} className="btn btn-primary">Authenticate with Google Drive</button>
          )}
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {assistanceToast && <div className="alert alert-success">{assistanceToast}</div>}

      {authenticated ? (
        <main className="admin-main">
          <div className="admin-tabs">
            <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Documents</button>
            <button className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => { setActiveTab('queue'); loadQueueSnapshot(); }}>
              Queue ({queueSnapshot.nowServing.length + queueSnapshot.forPickup.length})
            </button>
            <button className={`tab-btn ${activeTab === 'trash' ? 'active' : ''}`} onClick={() => { setActiveTab('trash'); loadTrash(); }}>
              Trash ({trash.length})
            </button>
          </div>

          {activeTab === 'documents' && (
            <section className="pdfs-section">
              <div className="section-header">
                <h2>Generated Documents</h2>
              </div>

              <div className="doc-types-section">
                <div className="doc-types-label">Filter by Document Type</div>
                <div className="doc-types-buttons">
                  <button className={`doc-type-btn ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>
                    All ({totalItems})
                  </button>
                  {availableTypes.map((code) => (
                    <button key={code} className={`doc-type-btn ${typeFilter === code ? 'active' : ''}`} onClick={() => setTypeFilter(code)}>
                      {TYPE_LABELS[code] || code} ({typeCount[code] || 0})
                    </button>
                  ))}
                </div>
              </div>

              <div className="filters-section-header">Advanced Filters</div>
              <div className="filters-bar">
                <div className="filter-group filter-search">
                  <label className="filter-label">Search</label>
                  <input type="text" className="filter-input" placeholder="Search by name or reference number" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Status</label>
                  <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status} ({statusCount[status] || 0})</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label className="filter-label">From</label>
                  <input type="date" className="filter-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="filter-group">
                  <label className="filter-label">To</label>
                  <input type="date" className="filter-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Sort by</label>
                  <div className="filter-row">
                    <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="date">Date</option>
                      <option value="name">Name</option>
                      <option value="size">Size</option>
                    </select>
                    <select className="filter-select" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
                <button onClick={loadPdfs} disabled={loadingPdfs} className="btn btn-secondary btn-small">{loadingPdfs ? 'Refreshing...' : 'Refresh'}</button>
                <button
                  onClick={() => {
                    setQuery('');
                    setDateFrom('');
                    setDateTo('');
                    setSortBy('date');
                    setSortDir('desc');
                    setTypeFilter('all');
                    setStatusFilter('all');
                    setPage(1);
                  }}
                  className="btn btn-tertiary btn-small"
                  title="Clear all filters and search"
                >
                  Clear Filters
                </button>
              </div>

              {loadingPdfs && pdfs.length === 0 ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading documents...</p>
                </div>
              ) : pdfs.length === 0 ? (
                <div className="empty-state">
                  <p>No documents found</p>
                  <p className="text-muted">Documents will appear here once they are generated.</p>
                </div>
              ) : (
                <>
                  {selectedIds.size > 0 && (
                    <div className="selection-bar">
                      <span className="selection-info">{selectedIds.size} document(s) selected</span>
                      <button onClick={deleteMultiple} disabled={deletingId === 'multi'} className="btn btn-danger">
                        {deletingId === 'multi' ? 'Deleting...' : 'Delete Selected'}
                      </button>
                    </div>
                  )}

                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th className="cell-checkbox">
                            <input
                              ref={selectAllCheckbox}
                              type="checkbox"
                              checked={selectedIds.size > 0 && selectedIds.size === pagedPdfs.length}
                              onChange={selectAllVisible}
                              title="Select/deselect all on this page"
                            />
                          </th>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Size</th>
                          <th className="actions-col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedPdfs.map((pdf) => (
                          <tr key={pdf.id} className={selectedIds.has(pdf.id) ? 'selected' : ''}>
                            <td className="cell-checkbox">
                              <input type="checkbox" checked={selectedIds.has(pdf.id)} onChange={() => toggleSelectPdf(pdf.id)} />
                            </td>
                            <td className="cell-name" title={pdf.name}>{pdf.name}</td>
                            <td className="cell-type">{TYPE_LABELS[pdf.appProperties?.type] || pdf.appProperties?.type || '-'}</td>
                            <td className="cell-status">
                              <select
                                value={pdf.appProperties?.status || 'Pending'}
                                onChange={(e) => updateStatus(pdf.id, e.target.value)}
                                disabled={updatingStatusId === pdf.id}
                                className="status-select"
                              >
                                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                              </select>
                            </td>
                            <td className="cell-date">
                              {new Date(pdf.createdTime).toLocaleDateString()} {new Date(pdf.createdTime).toLocaleTimeString()}
                            </td>
                            <td className="cell-size">{(pdf.size / 1024).toFixed(2)} KB</td>
                            <td className="cell-actions">
                              <button onClick={() => handleViewPdf(pdf)} className="btn btn-tertiary btn-small" title="Open in Google Drive">
                                View
                              </button>
                              <button onClick={() => downloadPdf(pdf)} className="btn btn-secondary btn-small" title="Download to local device">
                                Download
                              </button>
                              <button
                                onClick={() => deletePdf(pdf.id, pdf.name)}
                                disabled={deletingId === pdf.id}
                                className="btn btn-danger btn-small"
                                title="Delete from Google Drive"
                              >
                                {deletingId === pdf.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pagination">
                    <div className="pagination-left">
                      <span className="text-muted">{totalItems} items</span>
                    </div>
                    <div className="pagination-center">
                      <button className="btn btn-tertiary btn-small" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
                      <span className="page-indicator">Page {page} of {totalPages}</span>
                      <button className="btn btn-tertiary btn-small" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
                    </div>
                    <div className="pagination-right">
                      <label className="filter-label">Rows per page</label>
                      <select className="filter-select" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {activeTab === 'queue' && (
            <section className="pdfs-section">
              <div className="section-header">
                <h2>Live Queue Monitor</h2>
                <div className="auth-status">
                  <span className={`queue-pill ${queueConnected ? 'online' : 'offline'}`}>
                    {queueConnected ? 'Realtime Connected' : 'Realtime Disconnected'}
                  </span>
                  <button onClick={loadQueueSnapshot} className="btn btn-secondary btn-small" disabled={queueLoading}>
                    {queueLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>

              <div className="queue-grid">
                <div className="queue-column">
                  <h3>Now Serving ({orderedNowServing.length})</h3>
                  {orderedNowServing.length === 0 ? (
                    <div className="empty-state"><p>No document currently in Processing.</p></div>
                  ) : (
                    renderQueueCards(orderedNowServing, 'now-serving')
                  )}
                </div>

                <div className="queue-column">
                  <h3>For Pick-up ({orderedForPickup.length})</h3>
                  {orderedForPickup.length === 0 ? (
                    <div className="empty-state"><p>No document waiting for pickup.</p></div>
                  ) : (
                    renderQueueCards(orderedForPickup, 'for-pickup')
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'trash' && (
            <section className="trash-section">
              <div className="section-header">
                <h2>Recycle Bin</h2>
                <p className="text-muted">Soft-deleted documents can be permanently removed here</p>
              </div>

              {trash.length === 0 ? (
                <div className="empty-state"><p>Trash is empty</p></div>
              ) : (
                <>
                  <div className="toolbar">
                    <label className="checkbox-label">
                      <input
                        ref={trashSelectAllCheckbox}
                        type="checkbox"
                        checked={trashSelectedIds.size === trash.length && trash.length > 0}
                        onChange={() => {
                          if (trashSelectedIds.size === trash.length) {
                            setTrashSelectedIds(new Set());
                          } else {
                            setTrashSelectedIds(new Set(trash.map((item) => item.id)));
                          }
                        }}
                      />
                      <span>Select All</span>
                    </label>
                    {trashSelectedIds.size > 0 && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={restoreMultipleFromTrash} className="btn btn-success" disabled={deletingId === 'trash-restore-multi'}>
                          {deletingId === 'trash-restore-multi' ? 'Restoring...' : `Restore (${trashSelectedIds.size})`}
                        </button>
                        <button onClick={permanentlyDeleteMultipleFromTrash} className="btn btn-danger" disabled={deletingId === 'trash-multi'}>
                          {deletingId === 'trash-multi' ? 'Deleting...' : `Permanently Delete (${trashSelectedIds.size})`}
                        </button>
                      </div>
                    )}
                  </div>

                  <table className="documents-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}></th>
                        <th>File Name</th>
                        <th>Type</th>
                        <th>Deleted Date</th>
                        <th>Deleted By</th>
                        <th style={{ width: '120px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trash.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={trashSelectedIds.has(item.id)}
                                onChange={() => {
                                  const newSelected = new Set(trashSelectedIds);
                                  if (newSelected.has(item.id)) {
                                    newSelected.delete(item.id);
                                  } else {
                                    newSelected.add(item.id);
                                  }
                                  setTrashSelectedIds(newSelected);
                                }}
                              />
                            </label>
                          </td>
                          <td className="file-name">{item.name}</td>
                          <td>{TYPE_LABELS[item.appProperties?.type] || item.appProperties?.type || '-'}</td>
                          <td>{new Date(item.deletedAt).toLocaleDateString()}</td>
                          <td>{item.deletedBy || '-'}</td>
                          <td style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => restoreFromTrash(item.id, item.name)}
                              className="btn btn-success btn-small"
                              disabled={deletingId === item.id}
                              title="Restore to documents"
                            >
                              {deletingId === item.id ? 'Restoring...' : 'Restore'}
                            </button>
                            <button
                              onClick={() => permanentlyDeleteFromTrash(item.id, item.name)}
                              className="btn btn-danger btn-small"
                              disabled={deletingId === item.id}
                              title="Permanently delete"
                            >
                              {deletingId === item.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </section>
          )}
        </main>
      ) : (
        <main className="admin-main">
          <section className="auth-section">
            <div className="auth-card">
              <h2>Authentication Required</h2>
              <p>
                To access the admin dashboard and manage documents, you need to authenticate with your Google Drive account.
              </p>
              <button onClick={initiateAuth} className="btn btn-primary btn-large">Sign in with Google Drive</button>
              <p className="text-muted text-small">We use your Google Drive to securely store and manage generated documents.</p>
            </div>
          </section>
        </main>
      )}

      <footer className="admin-footer">
        <p>Property of Barangay Biluso, Silang, Cavite • Document Management Dashboard</p>
      </footer>
    </div>
  );
}

export default App;
