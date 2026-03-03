import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
const LanguageSelect = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen w-full">
            <div className="flex flex-col items-center justify-center">
                <div className="w-full flex justify-center items-center gap-6 mb-8 mt-2 flex-col md:flex-row">
                    <button
                        onClick={() => { handleLanguageChange('en'); navigate("/home"); }}
                        className={`px-16 py-10 rounded-3xl text-4xl font-extrabold shadow-lg transition-all duration-200 border-4 focus:outline-none
                    ${i18n.language === 'en' ? 'bg-emerald-600 text-white border-emerald-700 scale-110' : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'}`}
                        style={{ minWidth: 240 }}
                    >
                        English
                    </button>
                    <button
                        onClick={() => { handleLanguageChange('fil'); navigate("/home"); }}
                        className={`px-16 py-10 rounded-3xl text-4xl font-extrabold shadow-lg transition-all duration-200 border-4 focus:outline-none
                    ${i18n.language === 'fil' ? 'bg-emerald-600 text-white border-emerald-700 scale-110' : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'}`}
                        style={{ minWidth: 240 }}
                    >
                        Filipino
                    </button>
                </div>
            </div>
        </div>)

};

export default LanguageSelect;