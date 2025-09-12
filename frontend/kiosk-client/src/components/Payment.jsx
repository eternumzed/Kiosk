import axios from "axios";

const Payment = ({ formData, getFee, paymentStatus, setPaymentStatus, handleBack, handlePayment }) => {
 

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Payment</h2>
        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          <p className="text-xl font-bold">Fee Breakdown</p>
          <p className="text-lg">Document: {formData.document}</p>
          <p className="text-lg font-bold">Total: ₱{getFee().toFixed(2)}</p>
        </div>
        <div className="flex space-x-4 mt-6">
          <button
            onClick={handleBack}
            className="w-full bg-gray-200 text-gray-600 font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105"
          >
            Back
          </button>
          <button
            onClick={handlePayment}
            disabled={paymentStatus === "processing"}
            className={`w-full font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 ${
              paymentStatus === "processing"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {paymentStatus === "processing" ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
