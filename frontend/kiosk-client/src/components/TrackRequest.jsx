import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from 'axios';

const TrackRequest = () => {
    const [referenceNumber, setReferenceNumber] = useState('');
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    const handleTracking = async (e) => {
        e.preventDefault();
        setRequest(null);
        setError(false);

        if (referenceNumber) {
            try {

                const res = await axios.get(`http://localhost:5000/api/request/track-request/${referenceNumber}`);
                console.log(res.data[0])
                setRequest(res.data[0]);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching request:", err.response?.data || err.message);
                setError(true);
                setLoading(false);
            }
        }

    };



    return (
        <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Track Your Request</h2>
                <form onSubmit={handleTracking} className="space-y-4">
                    <input
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                        type="text"
                        placeholder="Enter Reference Number"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        required
                    />
                    <div className="flex space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="w-full bg-gray-200 text-gray-600 font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
                            disabled={loading}
                        >
                            {loading ? 'Tracking...' : 'Track'}
                        </button>
                    </div>
                </form>

                {loading && (
                    <div className="mt-6 p-4 bg-gray-100 rounded-lg text-gray-800 text-center">
                        <h3 className="font-bold">Searching for your request...</h3>
                        <p className="mt-2">This may take a moment.</p>
                    </div>
                )}

                {request && (
                    <div className="mt-6 p-4 rounded-lg text-center">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">Request Details:</h3>
                        <p className="text-xl font-extrabold break-words">Ref No: {request.referenceNumber}</p>
                        <p className="mt-2 text-md">Document: {request.document}</p>
                        <p className={`mt-2 text-xl font-bold ${request.status === 'Pending' ? 'text-yellow-600' :
                            request.status === 'Processing' ? 'text-blue-600' :
                                request.status === 'Completed' ? 'text-green-600' :
                                    'text-red-600'
                            }`}>
                            Status: {request.status}
                        </p>
                        {request.status === 'Completed' && (
                            <p className="mt-2 text-sm text-gray-600">You may claim it during office hours.</p>
                        )}
                        {request.status === 'Cancelled ' && (
                            <p className="mt-2 text-sm text-gray-600">Your request was cancelled. Contact us for details.</p>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 bg-red-100 rounded-lg text-red-800 text-center">
                        <h3 className="font-bold">Error</h3>
                        <p className="mt-2">Reference number not found. Please check and try again.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackRequest;