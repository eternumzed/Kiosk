import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function AssistanceButton({ onRequestAssistance }) {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('success');

  const openConfirm = () => {
    setFeedback('');
    setShowConfirm(true);
  };

  const closeConfirm = () => {
    if (isSending) return;
    setShowConfirm(false);
  };

  const handleConfirm = async () => {
    try {
      setIsSending(true);
      await onRequestAssistance();
      setFeedbackType('success');
      setFeedback(t('assistance_sent'));
      setShowConfirm(false);
    } catch (_err) {
      setFeedbackType('error');
      setFeedback(t('assistance_failed'));
    } finally {
      setIsSending(false);
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  return (
    <>
      <div className="fixed left-4 bottom-4 z-30">
        <button
          type="button"
          onClick={openConfirm}
          className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all duration-150 hover:bg-amber-600 active:scale-95"
        >
          {t('request_assistance')}
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800">{t('assistance_confirm_title')}</h3>
            <p className="mt-2 text-sm text-gray-600">{t('assistance_confirm_message')}</p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={isSending}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSending}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? t('sending') : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div className="fixed left-4 bottom-20 z-30">
          <div
            className={`rounded-xl px-4 py-2 text-sm font-semibold shadow ${
              feedbackType === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {feedback}
          </div>
        </div>
      )}
    </>
  );
}
