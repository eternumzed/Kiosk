import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full flex flex-col items-center justify-center p-4">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-bold text-emerald-800 mb-3">
                    Welcome
                </h1>
                <p className="text-lg text-gray-600">Barangay Document Request Kiosk</p>
            </div>
            <div className="flex flex-col space-y-4 w-full max-w-md">
                <button
                    onClick={() => navigate("/personal-info")}
                    className="w-full bg-emerald-600 text-white font-bold text-xl py-6 px-8 rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200"
                >
                    Request Document
                </button>
                <button
                    onClick={() => navigate("/track-request")}
                    className="w-full bg-white text-gray-800 font-bold text-xl py-6 px-8 rounded-2xl border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
                >
                    Track Request
                </button>
                <button
                    onClick={() => navigate("/help")}
                    className="w-full bg-white text-gray-800 font-bold text-xl py-6 px-8 rounded-2xl border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
                >
                    Help
                </button>
            </div>
        </div>
    );
};

export default Home;