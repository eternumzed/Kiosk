import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from 'axios';
import KeyboardInput from './KeyboardInput';
import { useKeyboard } from '../context/KeyboardContext';
import { useTranslation } from 'react-i18next';

const TrackRequest = () => {
    const [referenceNumber, setReferenceNumber] = useState('');
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const navigate = useNavigate();
    const { hideKeyboard } = useKeyboard();
    const { t } = useTranslation();

    useEffect(() => {
        return () => {
            hideKeyboard();
        };
    }, [hideKeyboard]);

    const handleTracking = async (e) => {
        e.preventDefault();
        hideKeyboard();
        setRequest(null);
        setError(false);

        const trackingNumber = referenceNumber.toUpperCase();
        setReferenceNumber(trackingNumber);

        if (trackingNumber) {
            try {
                const res = await axios.get(`https://api.brgybiluso.me/api/request/track-request/${trackingNumber}`);
                console.log(res.data[0]);

                if (res.data[0] !== undefined) {
                    setLoading(true)
                    setRequest(res.data[0]);
                } else {
                    setLoading(true)
                    setError(true)
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching request:", err.response?.data || err.message);
                setError(true);
                setLoading(false);
            }
        }
    };

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
        </div>
    );
};

export default TrackRequest;