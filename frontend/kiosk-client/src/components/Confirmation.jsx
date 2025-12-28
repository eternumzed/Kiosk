import { useEffect, useState } from 'react';
import axios from 'axios';

const Confirmation = ({ handleNext, resetUI }) => {

  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const fetchRequest = async (referenceNumber) => {
    try {
      setError(null);
      setRetrying(true);
      
      console.log('Fetching request:', referenceNumber);
      
      // Add timeout to request
      const config = {
        timeout: 10000, // 10 second timeout
      };
      
      const response = await axios.get(
        `http://localhost:5000/api/request/track-request/${referenceNumber}`,
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
      
    } catch (err) {
      console.error('Error fetching request:', err.message);
      
      // Provide more specific error messages
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. The server is not responding.');
      } else if (err.response?.status === 404) {
        const refNum = new URLSearchParams(location.search).get("referenceNumber");
        setError(`No request found with reference number: ${refNum}`);
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

    if (referenceNumber) {
      console.log('Confirmation: Reference ID: ' + referenceNumber);
      fetchRequest(referenceNumber);
    } else {
      setError('No reference number found');
    }

  }, [location]);

  if (error) {
    return (
      <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl transition-all duration-300 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Connection Error</h2>
          <p className="text-gray-700 mb-4">
            Unable to load your request details. The server may be temporarily unavailable.
          </p>
          <p className="text-sm text-gray-600 mb-6 font-mono bg-gray-100 p-3 rounded">
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
              className="w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-green-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {retrying ? 'Retrying...' : 'Retry'}
            </button>
            
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-700 transition-all duration-300"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl transition-all duration-300 text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-12 h-12 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg text-gray-700">Loading confirmation...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we retrieve your request details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl transition-all duration-300 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Request Confirmed!</h2>
        <p className="text-lg text-gray-600 mb-2">
          Your payment was successfully created in PayMongo.
        </p>

        <div className="p-4 bg-green-50 rounded-lg mb-6">
          <p className="text-sm font-bold text-green-700">Reference No:</p>
          <p className="text-xl font-extrabold text-green-800 break-words">{request.referenceNumber}</p>
        </div>

        <div className="space-y-2 text-gray-700">
          <p><span className="font-semibold">Full Name:</span> {request.fullName}</p>
          <p><span className="font-semibold">Document:</span> {request.document}</p>
          <p><span className="font-semibold">Amount:</span> ₱{request.amount}</p>
          <p><span className="font-semibold">Payment Method:</span> {request.paymentMethod}</p>
          <p><span className="font-semibold">Status:</span> {request.status}</p>
          <p><span className="font-semibold">Payment Status:</span> {request.paymentStatus}</p>
          <p><span className="font-semibold">Date:</span> {new Date(request.paidAt).toLocaleString("en-US", {
            timeZone: "Asia/Manila"
          })}</p>
        </div>


        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={async () => {
              try {
                await axios.post('http://localhost:5000/api/print', {
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
            className="flex-1 bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-lg shadow-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
          >
            Print Receipt
          </button>

          <button
            onClick={() => {
              handleNext()
              resetUI()
            }}
            className="flex-1 bg-green-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
          >
            Done
          </button>
        </div>
      </div>
    </div >
  );
};

export default Confirmation;