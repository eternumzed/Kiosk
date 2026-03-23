import React from 'react';
import { useTranslation } from 'react-i18next';

const Help = ({ handleBack }) => {
    const { t, i18n } = useTranslation();
    const currentLanguage = (i18n.resolvedLanguage || i18n.language || '').toLowerCase();
    const isFilipino =
        currentLanguage === 'fil' ||
        currentLanguage.startsWith('fil-') ||
        currentLanguage === 'tl' ||
        currentLanguage.startsWith('tl-');
    const videoUrl = isFilipino ? "/kiosk-tutorial_fil.mp4" : "/kiosk-tutorial.mp4";

    return (
        <div className="w-full flex flex-col items-center p-4">
            
            <div className="w-full max-w-4xl flex justify-start mb-4">
                <button
                    onClick={handleBack}
                    className="flex items-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-200 active:scale-[0.98] transition-all duration-200"
                    aria-label={t('help_go_back')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>{t('back_button')}</span>
                </button>
            </div>
            
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{t('help_how_to_use')}</h2>
                <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg border-4 border-emerald-500">
                    <video
                        key={videoUrl}
                        className="w-full h-full object-cover"
                        controls 
                        autoPlay 
                        loop     
                        muted    
                        playsInline 
                    >
                        <source src={videoUrl} type="video/mp4" />
                        {t('help_video_not_supported')}
                    </video>
                </div>
            </div>
        </div>
    );
}

export default Help;
