import { useEffect, useMemo, useRef, useState } from 'react';

const QUEUE_API_URL = 'https://api.brgybiluso.me/api/queue';
const QUEUE_WS_URL = 'wss://api.brgybiluso.me';

function QueueColumn({ title, subtitle, items, accent }) {
  const orderedItems = [...items].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
    if (aTime !== bTime) return aTime - bTime;
    return String(a.referenceNumber || '').localeCompare(String(b.referenceNumber || ''));
  });

  const visibleItems = orderedItems.slice(0, 10);
  const hiddenCount = Math.max(0, orderedItems.length - visibleItems.length);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-white/60 bg-white/95 p-2 shadow-lg backdrop-blur-sm">
      <div className="mb-1 flex items-baseline justify-between border-b border-slate-200 pb-1">
        <h2 className={`text-[clamp(2rem,4vw,3.6rem)] font-black uppercase tracking-tight ${accent}`}>{title}</h2>
        <p className="text-[clamp(0.82rem,1.35vw,1.05rem)] font-bold uppercase tracking-wider text-slate-500">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2 text-center text-lg font-bold uppercase text-slate-500">
          Waiting for updates...
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          {visibleItems.map((item, idx) => (
            <article
              key={`${item.referenceNumber}-${idx}`}
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 shadow-sm"
            >
              <p className="truncate text-[clamp(1.7rem,3.2vw,3rem)] font-black uppercase leading-tight text-slate-900">
                {String(item.referenceNumber || '').toUpperCase()}
              </p>
              <p className="truncate text-[clamp(0.95rem,1.35vw,1.25rem)] font-bold uppercase text-slate-600">
                {String(item.document || '-').toUpperCase()}
              </p>
            </article>
          ))}
          {hiddenCount > 0 && (
            <div className="rounded-lg bg-amber-50 px-2 py-1 text-center text-sm font-bold uppercase text-amber-700">
              +{hiddenCount} more in queue
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function QueueDisplay() {
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
          <p className="text-[0.78rem] font-bold uppercase tracking-wide">Total in Queue</p>
          <p className="text-[clamp(1.3rem,2.8vw,2.2rem)] font-black uppercase">{total}</p>
          <p className="text-[0.78rem] font-bold uppercase tracking-wide text-slate-600">
            {connected ? 'Realtime Online' : 'Reconnecting...'} • {clock.toLocaleTimeString('en-PH')}
          </p>
        </div>

        <div className="grid h-full min-h-0 grid-cols-2 gap-2">
          <QueueColumn
            title="Now Serving"
            subtitle="Status: Processing"
            items={queueSnapshot.nowServing}
            accent="text-blue-700"
          />
          <QueueColumn
            title="For Pick-up"
            subtitle="Status: For Pick-up"
            items={queueSnapshot.forPickup}
            accent="text-emerald-700"
          />
        </div>
      </div>
    </div>
  );
}
