/* src/components/Confirmation.jsx */
import React from 'react';


const Confirmation = ({ requestRef, resetUI, handleBack }) => {
    return (
        <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl transition-all duration-300 text-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Request Confirmed!</h2>
                <p className="text-lg text-gray-600 mb-2">Your request has been successfully submitted.</p>
                <div className="p-4 bg-green-50 rounded-lg mb-6">
                    <p className="text-sm font-bold text-green-700">Request Reference Number:</p>
                    <p className="text-3xl font-extrabold text-green-800 break-words">{requestRef}</p>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                    You can use this number to track your request.
                    <br /> A confirmation will be sent via SMS.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <button
                        onClick={() => window.print()}
                        className="flex-1 bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-lg shadow-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
                    >
                        Print Receipt
                    </button>
                    <button
                        onClick={resetUI}
                        className="flex-1 bg-green-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};


export default Confirmation;