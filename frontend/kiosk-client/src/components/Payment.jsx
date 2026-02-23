const Payment = ({ formData, getFee, paymentStatus, setPaymentStatus, handleBack, handlePayment, handleCashPayment }) => {

  console.log("Form data after selecting doc:", formData);

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Payment</h2>
        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          <p className="text-xl font-bold">Fee Breakdown</p>
          <p className="text-lg">Document: {formData.document}</p>
          <p className="text-lg font-bold">Total: ₱{getFee().toFixed(2)}</p>
        </div>
        
        {paymentStatus === "Processing" && (
          <div className="mb-6 p-6 bg-blue-50 rounded-lg">
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-blue-700">Processing your request...</p>
            <div className="mt-4 w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full"></div>
            </div>
          </div>
        )}

        <div className="space-y-4 mt-6">
          <div className="flex flex-col gap-3">
            <button
              onClick={handlePayment}
              disabled={paymentStatus === "Processing"}
              className={`w-full font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 ${paymentStatus === "Processing"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              {paymentStatus === "Processing" ? "Processing..." : "Pay with E-Wallet"}
            </button>
            
            <button
              onClick={handleCashPayment}
              disabled={paymentStatus === "Processing"}
              className={`w-full font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 ${paymentStatus === "Processing"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
                }`}
            >
              {paymentStatus === "Processing" ? "Processing..." : "Pay with Cash"}
            </button>
          </div>

          <button
            onClick={handleBack}
            disabled={paymentStatus === "Processing"}
            className={`w-full font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 ${paymentStatus === "Processing"
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
