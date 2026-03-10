import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from 'axios';
import jsQR from 'jsqr';
import KeyboardInput from './KeyboardInput';
import { useKeyboard } from '../context/KeyboardContext';
import { useTranslation } from 'react-i18next';

const TrackRequest = () => {
    const [referenceNumber, setReferenceNumber] = useState('');
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scannerError, setScannerError] = useState('');
    const [scannerBusy, setScannerBusy] = useState(false);
    const [qrBounds, setQrBounds] = useState(null);
    const navigate = useNavigate();
    const { hideKeyboard } = useKeyboard();
    const { t } = useTranslation();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanTimerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const scanActiveRef = useRef(false);
    const scanInProgressRef = useRef(false);
    const lastDecodeAttemptRef = useRef(0);
    const lastProgressRef = useRef(0);
    const restartAttemptsRef = useRef(0);
    const fetchInFlightRef = useRef(false);
    const lastDetectionAtRef = useRef(0);

    const statusKey = (status) => {
        const normalized = String(status || '').toLowerCase().replace(/[^a-z]/g, '');
        return `status_${normalized}`;
    };

    useEffect(() => {
        return () => {
            hideKeyboard();
        };
    }, [hideKeyboard]);

    const fetchByReference = async (reference) => {
        const trackingNumber = String(reference || '').trim().toUpperCase();
        setReferenceNumber(trackingNumber);

        if (!trackingNumber) return;

        setRequest(null);
        setError(false);
        setLoading(true);

        try {
            const res = await axios.get(`https://api.brgybiluso.me/api/request/track-request/${trackingNumber}`);
            if (res.data[0] !== undefined) {
                setRequest(res.data[0]);
            } else {
                setError(true);
            }
        } catch (err) {
            console.error("Error fetching request:", err.response?.data || err.message);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleTracking = async (e) => {
        e.preventDefault();
        hideKeyboard();
        fetchByReference(referenceNumber);
    };

    const extractReferenceFromQr = (rawText) => {
        const text = String(rawText || '').trim();
        if (!text) return null;

        // Accept full tracking URL QR
        if (text.startsWith('http://') || text.startsWith('https://')) {
            try {
                const parsed = new URL(text);
                const fromParam = parsed.searchParams.get('referenceNumber');
                if (fromParam) return fromParam.toUpperCase();
            } catch (_) {
                // Continue to regex fallback below
            }
        }

        // Accept direct reference code QR (fallback)
        const match = text.match(/[A-Z]{2,}-\d{4}-\d{3,}/i);
        return match ? match[0].toUpperCase() : null;
    };

    const stopScanner = () => {
        scanActiveRef.current = false;
        scanInProgressRef.current = false;
        setQrBounds(null);

        if (scanTimerRef.current) {
            clearTimeout(scanTimerRef.current);
            scanTimerRef.current = null;
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        setScannerBusy(false);
    };

    const startScanner = async () => {
        setScannerError('');
        setScannerBusy(true);
        setQrBounds(null);
        hideKeyboard();

        scanActiveRef.current = true;
        scanInProgressRef.current = false;
        lastDecodeAttemptRef.current = 0;
        lastProgressRef.current = Date.now();

        const scheduleAutoRecover = () => {
            if (scanTimerRef.current) {
                clearTimeout(scanTimerRef.current);
            }

            scanTimerRef.current = setTimeout(async () => {
                if (!scanActiveRef.current) return;
                const elapsed = Date.now() - lastProgressRef.current;

                if (elapsed < 10000) {
                    scheduleAutoRecover();
                    return;
                }

                if (restartAttemptsRef.current >= 2) {
                    return;
                }

                restartAttemptsRef.current += 1;
                setScannerError(t('scanning_qr_restart', { defaultValue: 'Scanning is taking longer than expected. Restarting camera...' }));

                stopScanner();
                setScannerOpen(true);
                setTimeout(() => {
                    startScanner();
                }, 250);
            }, 3000);
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });

            streamRef.current = stream;

            const [videoTrack] = stream.getVideoTracks();
            if (videoTrack?.getCapabilities && videoTrack?.applyConstraints) {
                try {
                    const caps = videoTrack.getCapabilities();
                    const advanced = [];
                    if (caps.focusMode?.includes('continuous')) {
                        advanced.push({ focusMode: 'continuous' });
                    }
                    if (caps.exposureMode?.includes('continuous')) {
                        advanced.push({ exposureMode: 'continuous' });
                    }
                    if (advanced.length > 0) {
                        await videoTrack.applyConstraints({ advanced });
                    }
                } catch (constraintErr) {
                    console.warn('Could not apply advanced camera constraints:', constraintErr);
                }
            }

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();

                if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
                    await new Promise((resolve) => {
                        const handleLoadedMeta = () => {
                            videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMeta);
                            resolve();
                        };

                        videoRef.current?.addEventListener('loadedmetadata', handleLoadedMeta);
                        setTimeout(resolve, 800);
                    });
                }
            }

            let detector = null;
            if ('BarcodeDetector' in window) {
                try {
                    detector = new window.BarcodeDetector({ formats: ['qr_code'] });
                } catch (err) {
                    console.warn('BarcodeDetector unavailable, falling back to jsQR:', err);
                }
            }

            const decodeWithJsQr = () => {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (!video || !canvas || !video.videoWidth || !video.videoHeight) return null;

                const context = canvas.getContext('2d', { willReadFrequently: true });
                if (!context) return null;

                const maxDimension = 960;
                const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
                const width = Math.max(320, Math.floor(video.videoWidth * scale));
                const height = Math.max(240, Math.floor(video.videoHeight * scale));

                canvas.width = width;
                canvas.height = height;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'attemptBoth',
                });

                if (!qrCode) return null;

                const location = qrCode.location;
                const points = [
                    location?.topLeftCorner,
                    location?.topRightCorner,
                    location?.bottomRightCorner,
                    location?.bottomLeftCorner,
                ].filter(Boolean);

                let bounds = null;
                if (points.length >= 4) {
                    const xs = points.map((p) => p.x);
                    const ys = points.map((p) => p.y);
                    const x = Math.max(0, Math.min(...xs));
                    const y = Math.max(0, Math.min(...ys));
                    const w = Math.max(0, Math.max(...xs) - x);
                    const h = Math.max(0, Math.max(...ys) - y);

                    bounds = {
                        xPct: (x / width) * 100,
                        yPct: (y / height) * 100,
                        wPct: (w / width) * 100,
                        hPct: (h / height) * 100,
                    };
                }

                return { rawValue: qrCode.data, bounds };
            };

            const scanLoop = async () => {
                if (!scanActiveRef.current) return;
                const now = Date.now();

                if (scanInProgressRef.current || now - lastDecodeAttemptRef.current < 120) {
                    animationFrameRef.current = requestAnimationFrame(scanLoop);
                    return;
                }

                lastDecodeAttemptRef.current = now;
                scanInProgressRef.current = true;

                try {
                    let rawValue = null;
                    let detectedBounds = null;
                    const videoElement = videoRef.current;

                    if (!videoElement || videoElement.readyState < 2) {
                        scanInProgressRef.current = false;
                        animationFrameRef.current = requestAnimationFrame(scanLoop);
                        return;
                    }

                    if (detector) {
                        const results = await detector.detect(videoElement);
                        if (results.length > 0) {
                            const first = results[0];
                            rawValue = first.rawValue;

                            if (Array.isArray(first.cornerPoints) && first.cornerPoints.length > 0) {
                                const xs = first.cornerPoints.map((p) => p.x);
                                const ys = first.cornerPoints.map((p) => p.y);
                                const x = Math.max(0, Math.min(...xs));
                                const y = Math.max(0, Math.min(...ys));
                                const w = Math.max(0, Math.max(...xs) - x);
                                const h = Math.max(0, Math.max(...ys) - y);

                                detectedBounds = {
                                    xPct: (x / videoElement.videoWidth) * 100,
                                    yPct: (y / videoElement.videoHeight) * 100,
                                    wPct: (w / videoElement.videoWidth) * 100,
                                    hPct: (h / videoElement.videoHeight) * 100,
                                };
                            }
                        }
                    }

                    if (!rawValue) {
                        const jsQrResult = decodeWithJsQr();
                        rawValue = jsQrResult?.rawValue || null;
                        detectedBounds = jsQrResult?.bounds || null;
                    }

                    if (!rawValue) {
                        if (Date.now() - lastDetectionAtRef.current > 500) {
                            setQrBounds(null);
                        }
                        return;
                    }

                    lastDetectionAtRef.current = Date.now();
                    if (detectedBounds) {
                        setQrBounds(detectedBounds);
                    }

                    const extractedReference = extractReferenceFromQr(rawValue);

                    if (!extractedReference) {
                        setScannerError('QR detected but no valid reference number found.');
                        return;
                    }

                    if (fetchInFlightRef.current) {
                        return;
                    }

                    fetchInFlightRef.current = true;
                    setScannerOpen(false);
                    stopScanner();
                    await fetchByReference(extractedReference);
                } catch (detectErr) {
                    console.error('QR detect error:', detectErr);
                } finally {
                    scanInProgressRef.current = false;
                    if (scanActiveRef.current) {
                        animationFrameRef.current = requestAnimationFrame(scanLoop);
                    }
                }

                lastProgressRef.current = Date.now();
            };

            setScannerError('');
            scheduleAutoRecover();
            animationFrameRef.current = requestAnimationFrame(scanLoop);
        } catch (err) {
            console.error('Camera start error:', err);
            setScannerError('Unable to access camera. Please allow camera permission.');
            stopScanner();
        }
    };

    const openScanner = async () => {
        restartAttemptsRef.current = 0;
        fetchInFlightRef.current = false;
        setScannerOpen(true);
        setScannerError('');
        await startScanner();
    };

    const closeScanner = () => {
        restartAttemptsRef.current = 0;
        fetchInFlightRef.current = false;
        setScannerOpen(false);
        stopScanner();
    };

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    return (
        <div className="w-full flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-xl border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">{t('track_title')}</h2>
                <form onSubmit={handleTracking} className="space-y-6">
                    <KeyboardInput
                        type="text"
                        placeholder={t('ref_placeholder')}
                        value={referenceNumber}
                        onChange={(value) => setReferenceNumber(value)}
                    />
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => { hideKeyboard(); navigate('/'); }}
                            className="w-1/2 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 border border-gray-200"
                        >
                            {t('back_button')}
                        </button>
                        <button
                            type="submit"
                            className="w-1/2 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200"
                            disabled={loading}
                        >
                            {loading ? t('tracking_loading') : t('track_button')}
                        </button>
                    </div>

                    <h2 className="mt-6 text-2xl font-bold mb-6 text-center text-gray-800">{t('track_or_qr')}</h2>
                    <button
                        type="button"
                        className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 mx-auto block"
                        onClick={openScanner}
                    >{t('scan_qr')}</button>

                </form>


                {loading && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl text-gray-800 text-center border border-gray-200">
                        <h3 className="font-bold">{t('searching')}</h3>
                        <p className="mt-2 text-gray-600">{t('searching_sub')}</p>
                    </div>
                )}

                {request && (
                    <div className="mt-6 p-6 bg-emerald-50 rounded-xl text-center border border-emerald-200">
                        <h3 className="font-bold text-lg text-gray-800 mb-3">{t('request_details')}</h3>
                        <p className="text-xl font-bold text-emerald-800 break-words">{request.referenceNumber}</p>
                        <p className="mt-3 text-gray-700">{t('label_document')}: <span className="font-semibold">{request.document}</span></p>
                        <p className={`mt-3 text-xl font-bold ${request.status === 'Pending' ? 'text-amber-600' :
                            request.status === 'Processing' ? 'text-blue-600' :
                                request.status === 'Completed' ? 'text-emerald-600' :
                                    'text-red-600'
                            }`}>
                            {t('label_status')}: {t(statusKey(request.status), { defaultValue: request.status })}
                        </p>
                        {request.status === 'Completed' && (
                            <p className="mt-3 text-sm text-gray-600 bg-emerald-100 py-2 px-4 rounded-lg inline-block">{t('status_completed_note')}</p>
                        )}
                        {request.status === 'Cancelled' && (
                            <p className="mt-3 text-sm text-gray-600">{t('status_cancelled_note')}</p>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 bg-red-50 rounded-xl text-red-800 text-center border border-red-200">
                        <h3 className="font-bold">{t('error_title')}</h3>
                        <p className="mt-2">{t('error_not_found')}</p>
                    </div>
                )}
            </div>

            {scannerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-800">{t('scan_receipt_qr')}</h3>
                        <p className="mt-1 text-sm text-gray-600">{t('scan_receipt_qr_hint')}</p>

                        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-black">
                            <div className="relative h-[340px] w-full">
                                <video ref={videoRef} className="h-full w-full object-contain" muted playsInline autoPlay />

                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <div className="h-[52%] w-[52%] rounded-2xl border-2 border-dashed border-white/65" />
                                </div>

                                {qrBounds && (
                                    <div
                                        className="pointer-events-none absolute border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.16)] transition-all duration-100"
                                        style={{
                                            left: `${Math.max(0, Math.min(96, qrBounds.xPct))}%`,
                                            top: `${Math.max(0, Math.min(96, qrBounds.yPct))}%`,
                                            width: `${Math.max(4, Math.min(100, qrBounds.wPct))}%`,
                                            height: `${Math.max(4, Math.min(100, qrBounds.hPct))}%`,
                                        }}
                                    >
                                        <div className="absolute -top-6 left-0 rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                                            QR DETECTED
                                        </div>
                                    </div>
                                )}
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                        </div>

                        {scannerBusy && !scannerError && (
                            <p className="mt-3 text-sm text-emerald-700">{qrBounds ? t('scanning_qr_detected', { defaultValue: 'QR detected. Validating reference...' }) : t('scanning_qr')}</p>
                        )}

                        {scannerError && (
                            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{scannerError}</p>
                        )}

                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={closeScanner}
                                className="rounded-lg bg-gray-100 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-200"
                            >
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackRequest;