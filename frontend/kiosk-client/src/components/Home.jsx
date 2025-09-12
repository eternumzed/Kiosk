/* src/components/Home.jsx */
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";



const Home = ({ handleNext }) => {
    const navigate = useNavigate();

    return (
        <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-green-800 mb-8 sm:mb-12">
                Welcome
            </h1>
            <div className="flex flex-col space-y-4 w-full max-w-sm sm:max-w-md">
                <button
                    onClick={() => navigate("/personal-info")}
                    className="w-full bg-green-600 text-white font-bold text-xl py-6 px-8 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
                >
                    Request Document
                </button>
                <button
                    className="w-full bg-gray-200 text-gray-800 font-bold text-xl py-6 px-8 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
                    disabled
                >
                    Track Request
                </button>
                <button
                    className="w-full bg-gray-200 text-gray-800 font-bold text-xl py-6 px-8 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
                    disabled
                >
                    Help
                </button>
            </div>
        </div>
    );
};


export default Home;