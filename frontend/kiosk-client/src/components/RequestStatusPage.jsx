import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const TRACK_URL = 'https://api.brgybiluso.me/api/request/track-request';

function statusColor(status = '') {
  if (status === 'Processing') return 'text-blue-700 bg-blue-50 border-blue-200';
  if (status === 'For Pick-up') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (status === 'Completed') return 'text-teal-700 bg-teal-50 border-teal-200';
  if (status === 'Cancelled') return 'text-red-700 bg-red-50 border-red-200';
  return 'text-amber-700 bg-amber-50 border-amber-200';
}

export default function RequestStatusPage() {
  const { t } = useTranslation();
  const [referenceNumber, setReferenceNumber] = useState('');
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trackRequest = async (ref) => {
    if (!ref) return;

    try {
      setLoading(true);
      setError('');
      setRequest(null);

      const normalized = ref.trim().toUpperCase();
      setReferenceNumber(normalized);

      const response = await axios.get(`${TRACK_URL}/${normalized}`);
      const found = Array.isArray(response.data) ? response.data[0] : null;

      if (!found) {
        setError(t('status_not_found'));
        return;
      }

      setRequest(found);
    } catch (err) {
      setError(err.response?.data?.error || t('status_unavailable'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refFromQuery = params.get('referenceNumber');
    if (refFromQuery) {
      trackRequest(refFromQuery);
    }
  }, []);

  return (
    <div className="w-full min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-emerald-100 bg-white/95 p-6 shadow-xl md:p-8">
        <h1 className="text-3xl font-black text-slate-800">{t('status_page_title')}</h1>
        <p className="mt-2 text-slate-600">
          {t('status_page_subtitle')}
        </p>

        <form
          className="mt-6 flex flex-col gap-3 md:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            trackRequest(referenceNumber);
          }}
        >
          <input
            type="text"
            className="h-12 flex-1 rounded-xl border border-slate-300 px-4 text-base font-semibold uppercase tracking-wide outline-none focus:border-emerald-500"
            placeholder={t('status_page_placeholder')}
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
          <button
            type="submit"
            className="h-12 rounded-xl bg-emerald-600 px-6 font-bold text-white hover:bg-emerald-700"
            disabled={loading}
          >
            {loading ? t('status_page_checking') : t('status_page_check_button')}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {request && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">{t('status_page_reference')}</p>
            <p className="text-xl font-black text-slate-800">{request.referenceNumber}</p>

            <div className={`mt-4 inline-flex rounded-full border px-4 py-2 text-sm font-bold ${statusColor(request.status)}`}>
              {request.status}
            </div>

            <div className="mt-5 space-y-2 text-slate-700">
              <p><span className="font-semibold">{t('status_page_document')}:</span> {request.document || '-'}</p>
              <p><span className="font-semibold">{t('status_page_requested_by')}:</span> {request.fullName || '-'}</p>
              <p><span className="font-semibold">{t('status_page_payment')}:</span> {request.paymentStatus || '-'}</p>
              <p><span className="font-semibold">{t('status_page_last_update')}:</span> {new Date(request.updatedAt).toLocaleString('en-PH')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
