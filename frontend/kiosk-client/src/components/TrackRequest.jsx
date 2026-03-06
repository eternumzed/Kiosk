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
    const navigate = useNavigate();
    const { hideKeyboard } = useKeyboard();
    const { t } = useTranslation();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanTimerRef = useRef(null);

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
        if (scanTimerRef.current) {
            clearInterval(scanTimerRef.current);
            scanTimerRef.current = null;
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
        hideKeyboard();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
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

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'attemptBoth',
                });

                return qrCode?.data || null;
            };

            scanTimerRef.current = setInterval(async () => {
                if (!videoRef.current) return;

                try {
                    let rawValue = null;

                    if (detector) {
                        const results = await detector.detect(videoRef.current);
                        if (results.length > 0) {
                            rawValue = results[0].rawValue;
                        }
                    }

                    if (!rawValue) {
                        rawValue = decodeWithJsQr();
                    }

                    if (!rawValue) return;

                    const extractedReference = extractReferenceFromQr(rawValue);

                    if (!extractedReference) {
                        setScannerError('QR detected but no valid reference number found.');
                        return;
                    }

                    setScannerOpen(false);
                    stopScanner();
                    fetchByReference(extractedReference);
                } catch (detectErr) {
                    console.error('QR detect error:', detectErr);
                }
            }, 350);
        } catch (err) {
            console.error('Camera start error:', err);
            setScannerError('Unable to access camera. Please allow camera permission.');
            stopScanner();
        }
    };

    const openScanner = async () => {
        setScannerOpen(true);
        setScannerError('');
        await startScanner();
    };

    const closeScanner = () => {
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

                    <h2 className="mt-6 text-2xl font-bold mb-6 text-center text-gray-800">Or use QR</h2>
                    <button
                        type="button"
                        className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 mx-auto block"
                        onClick={openScanner}
                    >Scan QR </button>

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
                        <p className={`mt-3 text-xl font-bold ${request.status === t('status_pending') ? 'text-amber-600' :
                            request.status === t('status_processing') ? 'text-blue-600' :
                                request.status === t('status_completed') ? 'text-emerald-600' :
                                    'text-red-600'
                            }`}>
                            {t('label_status')}: {t(`status_${request.status.toLowerCase().replace(/ /g, '')}`)}
                        </p>
                        {request.status === t('status_completed') && (
                            <p className="mt-3 text-sm text-gray-600 bg-emerald-100 py-2 px-4 rounded-lg inline-block">{t('status_completed_note')}</p>
                        )}
                        {request.status === t('status_cancelled') && (
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
                        <h3 className="text-lg font-bold text-gray-800">Scan Receipt QR</h3>
                        <p className="mt-1 text-sm text-gray-600">Point the camera at the QR code printed on your receipt.</p>

                        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-black">
                            <video ref={videoRef} className="h-[340px] w-full object-cover" muted playsInline autoPlay />
                            <canvas ref={canvasRef} className="hidden" />
                        </div>

                        {scannerBusy && !scannerError && (
                            <p className="mt-3 text-sm text-emerald-700">Scanning for QR code...</p>
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
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackRequest;