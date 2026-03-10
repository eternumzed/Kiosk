
import { useTranslation } from 'react-i18next';

const Payment = ({ formData, getFee, paymentStatus, setPaymentStatus, handleBack, handlePayment, handleCashPayment, handleFreePayment }) => {
  const { t } = useTranslation();
  const fee = Number(getFee() || 0);
  const isFreeRequest = fee === 0;

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-xl border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">{t('payment_title')}</h2>
        <div className="p-6 bg-gray-50 rounded-xl mb-8 border border-gray-200">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('fee_breakdown')}</p>
          <p className="text-lg text-gray-700">{t('label_document')}: <span className="font-semibold">{formData.document}</span></p>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{t('label_total')}: ₱{fee.toFixed(2)}</p>
        </div>
        {paymentStatus === "Processing" && (
          <div className="mb-8 p-6 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12 text-emerald-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-emerald-700 text-center">{t('payment_processing')}</p>
            <div className="mt-4 w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-600 h-2 rounded-full animate-pulse w-full"></div>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {isFreeRequest ? (
            <button
              onClick={handleFreePayment}
              disabled={paymentStatus === "Processing"}
              className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 ${paymentStatus === "Processing"
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
                }`}
            >
              {paymentStatus === "Processing" ? t('btn_processing') : t('btn_continue')}
            </button>
          ) : (
            <>
              <button
                onClick={handlePayment}
                disabled={paymentStatus === "Processing"}
                className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 ${paymentStatus === "Processing"
                  ? "bg-gray-300 cursor-not-allowed text-gray-500"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                  }`}
              >
                {paymentStatus === "Processing" ? t('btn_processing') : t('btn_e_wallet')}
              </button>
              <button
                onClick={handleCashPayment}
                disabled={paymentStatus === "Processing"}
                className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 ${paymentStatus === "Processing"
                  ? "bg-gray-300 cursor-not-allowed text-gray-500"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
                  }`}
              >
                {paymentStatus === "Processing" ? t('btn_processing') : t('btn_cash')}
              </button>
            </>
          )}
          <button
            onClick={handleBack}
            disabled={paymentStatus === "Processing"}
            className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 border ${paymentStatus === "Processing"
              ? "bg-gray-100 cursor-not-allowed text-gray-400 border-gray-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.98] border-gray-200"
              }`}
          >
            {t('btn_back')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
