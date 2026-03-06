import { useEffect, useMemo, useRef, useState } from 'react';

const QUEUE_API_URL = 'https://api.brgybiluso.me/api/queue';
const QUEUE_WS_URL = 'wss://api.brgybiluso.me';

function QueueColumn({ title, subtitle, items, accent }) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
      <div className="mb-5">
        <h2 className={`text-4xl font-extrabold tracking-tight ${accent}`}>{title}</h2>
        <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-slate-500">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          Waiting for updates...
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <article
              key={`${item.referenceNumber}-${idx}`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
            >
              <p className="text-2xl font-black text-slate-800">{item.referenceNumber}</p>
              <p className="text-sm font-medium text-slate-600">{item.document || '-'}</p>
              <p className="mt-1 text-sm text-slate-500">{item.fullName || '-'}</p>
            </article>
          ))}
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
    <div className="w-full min-h-screen px-6 py-6 md:px-10 md:py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">Barangay Biluso Queue</h1>
              <p className="mt-2 text-sm uppercase tracking-widest text-emerald-100">
                Live Queue Display
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">{connected ? 'Realtime Online' : 'Reconnecting...'}</p>
              <p className="text-2xl font-bold">{clock.toLocaleTimeString('en-PH')}</p>
              <p className="text-sm">{clock.toLocaleDateString('en-PH')}</p>
            </div>
          </div>
        </header>

        <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-slate-700 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide">Total in Queue</p>
          <p className="text-2xl font-black">{total}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
