import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Confirmation = ({ handleNext, resetUI }) => {
  const { t } = useTranslation();

  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const retryCountRef = useRef(0);
  const maxAutoRetries = 3;

  const fetchRequest = async (referenceNumber, isAutoRetry = false) => {
    try {
      setError(null);
      setRetrying(true);
      
      console.log('Fetching request:', referenceNumber, isAutoRetry ? '(auto-retry)' : '');
      
      // Add timeout to request
      const config = {
        timeout: 10000, // 10 second timeout
      };
      
      const response = await axios.get(
        `https://api.brgybiluso.me/api/request/track-request/${referenceNumber}`,
        config
      );
      
      console.log('Request fetched successfully:', response.data);
      
      // Check if we got valid data
      if (!response.data || response.data.length === 0) {
        setError(`No request found with reference number: ${referenceNumber}`);
        setRetrying(false);
        return;
      }
      
      setRequest(response.data[0]);
      setRetrying(false);
      retryCountRef.current = 0; // Reset retry count on success
      
    } catch (err) {
      console.error('Error fetching request:', err.message);
      
      // Auto-retry on 502/network errors (up to maxAutoRetries times)
      const is502 = err.response?.status === 502;
      const isNetworkError = err.message.includes('Network') || err.code === 'ECONNABORTED';
      
      if ((is502 || isNetworkError) && retryCountRef.current < maxAutoRetries) {
        retryCountRef.current += 1;
        console.log(`Auto-retrying (${retryCountRef.current}/${maxAutoRetries})...`);
        
        // Wait a bit before retrying
        setTimeout(() => {
          fetchRequest(referenceNumber, true);
        }, 1000);
        return;
      }
      
      // Provide more specific error messages
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. The server is not responding.');
      } else if (err.response?.status === 404) {
        const refNum = new URLSearchParams(location.search).get("referenceNumber");
        setError(`No request found with reference number: ${refNum}`);
      } else if (err.response?.status === 502) {
        setError('Server temporarily unavailable. Please try again.');
      } else if (err.message.includes('Network')) {
        setError('Network error. Please check if the server is running.');
      } else {
        setError(err.message);
      }
      setRetrying(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const referenceNumber = params.get("referenceNumber");
    const isCashConfirmation = params.get("confirmation") === "true";

    if (referenceNumber) {
      console.log('Confirmation: Reference ID: ' + referenceNumber);
      fetchRequest(referenceNumber);
    } else {
      setError('No reference number found');
    }

  }, [location]);

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-xl border border-gray-100 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">{t('error_conn_title')}</h2>
          <p className="text-gray-700 mb-4">
            {t('error_conn_msg')}
          </p>
          <p className="text-sm text-gray-600 mb-6 font-mono bg-gray-50 p-3 rounded-xl border border-gray-200">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                const params = new URLSearchParams(location.search);
                const referenceNumber = params.get("referenceNumber");
                if (referenceNumber) {
                  fetchRequest(referenceNumber);
                }
              }}
              disabled={retrying}
              className="w-full bg-emerald-600 text-white font-semibold py-4 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {retrying ? t('btn_retrying') : t('btn_retry')}
            </button>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 border border-gray-200"
            >
              {t('btn_home')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-xl border border-gray-100 text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-12 h-12 text-emerald-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg text-gray-700 font-semibold">{t('conf_loading')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('conf_loading_sub')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-xl border border-gray-100 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('conf_title')}</h2>
        {request.paymentMethod === "Free" ? (
          <p className="text-gray-600 mb-4">
            {t('conf_free_msg')}
          </p>
        ) : request.paymentMethod === "Cash" ? (
          <p className="text-gray-600 mb-4">
            {t('conf_cash_msg')}
          </p>
        ) : (
          <p className="text-gray-600 mb-4">
            {t('conf_wallet_msg')}
          </p>
        )}
        <div className="p-4 bg-emerald-50 rounded-xl mb-6 border border-emerald-200">
          <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">{t('conf_ref_label')}</p>
          <p className="text-xl font-bold text-emerald-800 break-words mt-1">{request.referenceNumber}</p>
        </div>
        <div className="space-y-3 text-gray-700 text-left bg-gray-50 p-4 rounded-xl border border-gray-200">
          <p><span className="font-semibold text-gray-600">{t('label_name')}:</span> {request.fullName}</p>
          <p><span className="font-semibold text-gray-600">{t('label_document') || 'Document'}:</span> {request.document}</p>
          <p><span className="font-semibold text-gray-600">{t('label_amount')}:</span> ₱{request.amount}</p>
          <p><span className="font-semibold text-gray-600">{t('label_pay_method')}:</span> {request.paymentMethod}</p>
          <p><span className="font-semibold text-gray-600">{t('label_status') || 'Status'}:</span> {request.status}</p>
          <p><span className="font-semibold text-gray-600">{t('label_payment_status') || 'Payment Status'}:</span> {request.paymentStatus}</p>
          <p><span className="font-semibold text-gray-600">{t('label_date')}:</span> {new Date(request.paidAt).toLocaleString("en-US", {
            timeZone: "Asia/Manila"
          })}</p>
        </div>
        <div className="mt-6 flex gap-4">
          <button
            onClick={async () => {
              try {
                await axios.post('https://api.brgybiluso.me/api/print', {
                  referenceNumber: request.referenceNumber,
                  fullName: request.fullName,
                  document: request.document,
                  amount: request.amount,
                  paymentMethod: request.paymentMethod,
                  status: request.status,
                  paymentStatus: request.paymentStatus,
                  date: new Date(request.paidAt).toLocaleString("en-US", {
                    timeZone: "Asia/Manila"
                  }),
                });
              } catch (err) {
                console.error('Printing error:', err);
              }
            }}
            className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 border border-gray-200"
          >
            {t('btn_print')}
          </button>
          <button
            onClick={() => {
              handleNext()
              resetUI()
            }}
            className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200"
          >
            {t('btn_done')}
          </button>
        </div>
      </div>
    </div >
  );
};

export default Confirmation;