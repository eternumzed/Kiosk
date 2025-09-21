import { useEffect, useState } from 'react';
import axios from 'axios';

const Confirmation = ({ handleNext, resetUI }) => {

  const [request, setRequest] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestId = params.get("requestId");

    if (requestId) {
      axios
        .get(`http://localhost:5000/api/request/${requestId}`)
        .then((res) => {
          console.log('THE REQUEST ID IS' + requestId)
          setRequest(res.data)

        })
        .catch((err) => console.error("Error fetching request:", err));
    }
  }, [location]);

  if (!request) {
    return <p>Loading confirmation...</p>;
  }

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl transition-all duration-300 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Request Confirmed!</h2>
        <p className="text-lg text-gray-600 mb-2">
          Your payment was successfully created in PayMongo.
        </p>

        <div className="p-4 bg-green-50 rounded-lg mb-6">
          <p className="text-sm font-bold text-green-700">Reference ID:</p>
          <p className="text-xl font-extrabold text-green-800 break-words">{request.referenceNumber}</p>
        </div>

        <div className="space-y-2 text-gray-700">
          <p><span className="font-semibold">Document:</span> {request.document}</p>
          <p><span className="font-semibold">Full Name:</span> {request.fullName}</p>
          <p><span className="font-semibold">Amount:</span> ₱{request.amount}</p>
          <p><span className="font-semibold">Status:</span> {request.status}</p>
          <p><span className="font-semibold">Payment Status:</span> {request.paymentStatus}</p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => window.print()}
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