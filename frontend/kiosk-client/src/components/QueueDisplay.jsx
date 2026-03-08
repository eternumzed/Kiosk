import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const QUEUE_API_URL = 'https://api.brgybiluso.me/api/queue';
const QUEUE_WS_URL = 'wss://api.brgybiluso.me';

function QueueColumn({ title, subtitle, items, accent, t }) {
  const orderedItems = [...items].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
    if (aTime !== bTime) return aTime - bTime;
    return String(a.referenceNumber || '').localeCompare(String(b.referenceNumber || ''));
  });

  const visibleItems = orderedItems.slice(0, 16);
  const hiddenCount = Math.max(0, orderedItems.length - visibleItems.length);
  const shouldSplit = visibleItems.length > 7;
  const splitIndex = shouldSplit ? 8 : visibleItems.length;
  const leftItems = visibleItems.slice(0, splitIndex);
  const rightItems = shouldSplit ? visibleItems.slice(splitIndex) : [];

  const maxReferenceLength = visibleItems.reduce(
    (maxLen, item) => Math.max(maxLen, String(item.referenceNumber || '').length),
    0
  );
  const maxDocumentLength = visibleItems.reduce(
    (maxLen, item) => Math.max(maxLen, String(item.document || '').length),
    0
  );

  const referenceSizeClass = shouldSplit
    ? maxReferenceLength > 20
      ? 'text-[clamp(1.05rem,1.9vw,1.7rem)]'
      : maxReferenceLength > 16
        ? 'text-[clamp(1.3rem,2.4vw,2.2rem)]'
        : 'text-[clamp(1.7rem,3.2vw,3rem)]'
    : visibleItems.length <= 4
      ? (maxReferenceLength > 20
        ? 'text-[clamp(2rem,4.1vw,3.6rem)]'
        : maxReferenceLength > 16
          ? 'text-[clamp(2.2rem,4.5vw,3.9rem)]'
          : 'text-[clamp(2.5rem,5.1vw,4.2rem)]')
      : visibleItems.length <= 7
        ? (maxReferenceLength > 20
          ? 'text-[clamp(1.7rem,3.4vw,3rem)]'
          : maxReferenceLength > 16
            ? 'text-[clamp(1.9rem,3.8vw,3.3rem)]'
            : 'text-[clamp(2.2rem,4.2vw,3.6rem)]')
        : maxReferenceLength > 20
          ? 'text-[clamp(1.4rem,2.6vw,2.3rem)]'
          : maxReferenceLength > 16
            ? 'text-[clamp(1.7rem,3.1vw,2.8rem)]'
            : 'text-[clamp(1.95rem,3.5vw,3.1rem)]';

  const documentSizeClass = shouldSplit
    ? (maxDocumentLength > 26
      ? 'text-[clamp(0.78rem,1.05vw,1rem)]'
      : 'text-[clamp(0.95rem,1.35vw,1.25rem)]')
    : visibleItems.length <= 4
      ? (maxDocumentLength > 26
        ? 'text-[clamp(1.15rem,1.8vw,1.6rem)]'
        : 'text-[clamp(1.35rem,2.2vw,1.9rem)]')
      : visibleItems.length <= 7
        ? (maxDocumentLength > 26
          ? 'text-[clamp(1.02rem,1.5vw,1.4rem)]'
          : 'text-[clamp(1.2rem,1.9vw,1.65rem)]')
        : (maxDocumentLength > 26
          ? 'text-[clamp(0.92rem,1.3vw,1.2rem)]'
          : 'text-[clamp(1.08rem,1.55vw,1.4rem)]');

  const renderCard = (item, idx) => (
    <article
      key={`${item.referenceNumber}-${idx}`}
      className="rounded-lg border border-slate-200 bg-white px-2 py-2 shadow-sm"
    >
      <p className={`${referenceSizeClass} break-all font-black uppercase leading-tight text-slate-900`}>
        {String(item.referenceNumber || '').toUpperCase()}
      </p>
      <p className={`${documentSizeClass} break-words font-bold uppercase text-slate-600`}>
        {String(item.document || '-').toUpperCase()}
      </p>
    </article>
  );

  return (
    <section className="flex h-full flex-col rounded-2xl border border-white/60 bg-white/95 p-2 shadow-lg backdrop-blur-sm">
      <div className="mb-1 flex items-baseline justify-between border-b border-slate-200 pb-1">
        <h2 className={`text-[clamp(2rem,4vw,3.6rem)] font-black uppercase tracking-tight ${accent}`}>{title}</h2>
        <p className="text-[clamp(0.82rem,1.35vw,1.05rem)] font-bold uppercase tracking-wider text-slate-500">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2 text-center text-lg font-bold uppercase text-slate-500">
          {t('queue_waiting_updates')}
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          <div className={`grid h-full min-h-0 gap-1 ${shouldSplit ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="flex min-h-0 flex-col gap-1">{leftItems.map((item, idx) => renderCard(item, idx))}</div>
            {shouldSplit && (
              <div className="flex min-h-0 flex-col gap-1">{rightItems.map((item, idx) => renderCard(item, idx + splitIndex))}</div>
            )}
          </div>
          {hiddenCount > 0 && (
            <div className="rounded-lg bg-amber-50 px-2 py-1 text-center text-sm font-bold uppercase text-amber-700">
              {t('queue_more_count', { count: hiddenCount })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function QueueDisplay() {
  const { t } = useTranslation();
  const [queueSnapshot, setQueueSnapshot] = useState({ nowServing: [], forPickup: [] });
  const [connected, setConnected] = useState(false);
  const [clock, setClock] = useState(new Date());

  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const total = useMemo(
    () => queueSnapshot.nowServing.length + queueSnapshot.forPickup.length,
    [queueSnapshot]
  );

  const loadQueueSnapshot = async () => {
    try {
      const res = await fetch(QUEUE_API_URL);
      const data = await res.json();
      setQueueSnapshot({
        nowServing: data.nowServing || [],
        forPickup: data.forPickup || [],
      });
    } catch (err) {
      console.error('Failed to load queue snapshot:', err);
    }
  };

  const disconnect = () => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (err) {
        console.error('Queue socket close error:', err);
      }
      wsRef.current = null;
    }

    setConnected(false);
  };

  const connect = () => {
    disconnect();

    try {
      const ws = new WebSocket(QUEUE_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ type: 'subscribe-queue' }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'queue-update' && message.payload) {
            setQueueSnapshot({
              nowServing: message.payload.nowServing || [],
              forPickup: message.payload.forPickup || [],
            });
          }
        } catch (err) {
          console.error('Queue message parse error:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('Queue socket error:', err);
      };
    } catch (err) {
      console.error('Failed to create queue socket:', err);
    }
  };

  useEffect(() => {
    loadQueueSnapshot();
    connect();

    const clockTimer = setInterval(() => setClock(new Date()), 1000);
    const fallbackPoller = setInterval(loadQueueSnapshot, 15000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(fallbackPoller);
      disconnect();
    };
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-100 px-2 py-2 md:px-3 md:py-3">
      <div className="mx-auto flex h-full max-w-[1920px] flex-col">
        <div className="mb-1 flex items-center justify-between rounded-xl bg-white/90 px-3 py-2 text-slate-700 shadow-sm">
          <p className="text-[0.78rem] font-bold uppercase tracking-wide">{t('queue_total_in_queue')}</p>
          <p className="text-[clamp(1.3rem,2.8vw,2.2rem)] font-black uppercase">{total}</p>
          <p className="text-[0.78rem] font-bold uppercase tracking-wide text-slate-600">
            {connected ? t('queue_realtime_online') : t('queue_reconnecting')} • {clock.toLocaleTimeString('en-PH')}
          </p>
        </div>

        <div className="grid h-full min-h-0 grid-cols-2 gap-2">
          <QueueColumn
            title={t('queue_now_serving')}
            subtitle={t('queue_status_processing')}
            items={queueSnapshot.nowServing}
            accent="text-blue-700"
            t={t}
          />
          <QueueColumn
            title={t('queue_for_pickup')}
            subtitle={t('queue_status_for_pickup')}
            items={queueSnapshot.forPickup}
            accent="text-emerald-700"
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
