import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'fil', label: 'FIL' },
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.language?.startsWith('fil') ? 'fil' : 'en';

  return (
    <div className="fixed right-4 top-4 z-30 rounded-2xl border border-emerald-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
        {t('select_language')}
      </p>
      <div className="flex items-center gap-2">
        {LANGUAGES.map((lang) => {
          const active = currentLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`rounded-xl px-3 py-1.5 text-sm font-bold transition-all duration-150 ${
                active
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
              aria-pressed={active}
              aria-label={`Switch language to ${lang.code === 'en' ? 'English' : 'Filipino'}`}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
