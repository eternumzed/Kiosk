import React, { useState } from 'react';

// Mock data for documents and fees with added categories
const documents = [
  { name: 'Cedula', fee: 50, category: 'Civil Registry' },
  { name: 'Birth Certificate', fee: 150, category: 'Civil Registry' },
  { name: 'Marriage Certificate', fee: 200, category: 'Civil Registry' },
  { name: 'Death Certificate', fee: 200, category: 'Civil Registry' },
  { name: 'Barangay Clearance', fee: 100, category: 'Taxation & Fees' },
  { name: 'Building Permit', fee: 500, category: 'Business & Permits' },
  { name: 'Health Certificate', fee: 100, category: 'Licensing' },
];

// Main App Component
const App = () => {
  // State management for the current screen and form data
  const [currentScreen, setCurrentScreen] = useState('home');
  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    address: '',
    document: '',
  });
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [requestRef, setRequestRef] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleNext = (screen) => {
    setCurrentScreen(screen);
  };

  const handleBack = () => {
    switch (currentScreen) {
      case 'personalInfo':
        handleNext('home');
        break;
      case 'selectDocument':
        handleNext('personalInfo');
        break;
      case 'payment':
        handleNext('selectDocument');
        break;
      case 'confirmation':
        // TO BE REMOVED LATER. ONLY FOR DEBUGGING
        handleNext('payment');
        break;
      default:
        handleNext('home');
    }
  };

  const handleFormChange = (e) => {

    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDocumentSelect = (docName) => {
    setFormData({ ...formData, document: docName });
    handleNext('payment');
  };

  const handlePayment = async () => {
    setPaymentStatus('processing');

    try {
      // Placeholder for MERN stack API call
      // const response = await fetch('/api/request-document', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(formData),
      // });

      // const result = await response.json();
      // const newRequestRef = result.requestRef;

      // Mock a successful response and generate a reference number
      const newRequestRef = `REQ-${Date.now()}`;
      setRequestRef(newRequestRef);
      setPaymentStatus('completed');

      // Navigate to confirmation screen on success
      handleNext('confirmation');

    } catch (error) {
      console.error("Error processing payment:", error);
      setPaymentStatus('failed');
      // Show a modal or message box for the user
    }
  };

  const getFee = () => {
    const doc = documents.find(d => d.name === formData.document);
    return doc ? doc.fee : 0;
  };

  const resetUI = () => {
    setFormData({
      fullName: '',
      contactNumber: '',
      address: '',
      document: '',
    });
    setPaymentStatus('pending');
    setRequestRef('');
    setCurrentScreen('home');
  };

  const filteredDocuments = documents.filter(doc =>
    (selectedCategory === 'All' || doc.category === selectedCategory) &&
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 'personalInfo':
        return (
          <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl transition-all duration-300">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Personal Information</h2>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleNext('selectDocument'); }}>
                <input
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  required
                />
                <input
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                  type="tel"
                  name="contactNumber"
                  placeholder="Contact Number"
                  value={formData.contactNumber}
                  onChange={handleFormChange}
                  required
                />
                <select
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleFormChange}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                  required
                >
                  <option className="text-gray-400" value="" >Select Barangay</option>
                  <option value="Burol I">Burol I</option>
                  <option value="Burol II">Burol II</option>
                  <option value="Burol III">Burol III</option>
                  <option value="Datu Esmael">Datu Esmael</option>
                  <option value="Emmanuel Bergado I">Emmanuel Bergado I</option>
                  <option value="Emmanuel Bergado II">Emmanuel Bergado II</option>
                  <option value="Fatima I">Fatima I</option>
                  <option value="Fatima II">Fatima II</option>
                  <option value="Fatima III">Fatima III</option>
                  <option value="H-2">H-2</option>
                  <option value="Langkaan I">Langkaan I</option>
                  <option value="Langkaan II">Langkaan II</option>
                  <option value="Luzviminda I">Luzviminda I</option>
                  <option value="Luzviminda II">Luzviminda II</option>
                  <option value="Paliparan I">Paliparan I</option>
                  <option value="Paliparan II">Paliparan II</option>
                  <option value="Paliparan III">Paliparan III</option>
                  <option value="Sabang">Sabang</option>
                  <option value="Salawag">Salawag</option>
                  <option value="Salitran I">Salitran I</option>
                  <option value="Salitran II">Salitran II</option>
                  <option value="Salitran III">Salitran III</option>
                  <option value="Salitran IV">Salitran IV</option>
                  <option value="San Agustin I">San Agustin I</option>
                  <option value="San Agustin II">San Agustin II</option>
                  <option value="San Agustin III">San Agustin III</option>
                  <option value="San Andres I">San Andres I</option>
                  <option value="San Andres II">San Andres II</option>
                  <option value="San Antonio de Padua I">San Antonio de Padua I</option>
                  <option value="San Antonio de Padua II">San Antonio de Padua II</option>
                  <option value="San Dionisio">San Dionisio</option>
                  <option value="San Esteban">San Esteban</option>
                  <option value="San Francisco I">San Francisco I</option>
                  <option value="San Francisco II">San Francisco II</option>
                  <option value="San Isidro Labrador I">San Isidro Labrador I</option>
                  <option value="San Isidro Labrador II">San Isidro Labrador II</option>
                  <option value="San Jose">San Jose</option>
                  <option value="San Juan">San Juan</option>
                  <option value="San Lorenzo Ruiz I">San Lorenzo Ruiz I</option>
                  <option value="San Lorenzo Ruiz II">San Lorenzo Ruiz II</option>
                  <option value="San Luis I">San Luis I</option>
                  <option value="San Luis II">San Luis II</option>
                  <option value="San Manuel I">San Manuel I</option>
                  <option value="San Manuel II">San Manuel II</option>
                  <option value="San Marino">San Marino</option>
                  <option value="San Mateo">San Mateo</option>
                  <option value="San Miguel">San Miguel</option>
                  <option value="San Nicolas I">San Nicolas I</option>
                  <option value="San Nicolas II">San Nicolas II</option>
                  <option value="San Roque">San Roque</option>
                  <option value="San Simon">San Simon</option>
                  <option value="Santa Cristina I">Santa Cristina I</option>
                  <option value="Santa Cristina II">Santa Cristina II</option>
                  <option value="Santa Cruz I">Santa Cruz I</option>
                  <option value="Santa Cruz II">Santa Cruz II</option>
                  <option value="Santa Fe">Santa Fe</option>
                  <option value="Santa Lucia">Santa Lucia</option>
                  <option value="Santa Maria">Santa Maria</option>
                  <option value="Santo Cristo">Santo Cristo</option>
                  <option value="Santo Niño I">Santo Niño I</option>
                  <option value="Santo Niño II">Santo Niño II</option>
                  <option value="Santo Niño III">Santo Niño III</option>
                  <option value="Victoria Reyes">Victoria Reyes</option>
                </select>

                <div className="text-sm text-gray-500">
                  <p className="mt-4 text-center">ID Upload not yet implemented.</p>
                </div>
                <div className="flex space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full bg-gray-200 text-gray-600 font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'selectDocument':
        return (
          <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-4xl transition-all duration-300 flex flex-col sm:flex-row">
              {/* Left Sidebar for Categories */}
              <div className="w-full sm:w-1/4 mb-6 sm:mb-0 sm:pr-8 flex flex-col items-center sm:items-start space-y-4">
                <h3 className="text-lg font-bold text-gray-800 hidden sm:block">Categories</h3>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`w-full font-semibold py-4 px-6 rounded-lg shadow-md focus:outline-none focus:ring-4 transition-colors duration-200 ${selectedCategory === 'All' ? 'bg-green-600 text-white focus:ring-green-300' : 'bg-gray-200 text-gray-800 focus:ring-gray-300'}`}
                >
                  All Documents
                </button>
                <button
                  onClick={() => setSelectedCategory('Civil Registry')}
                  className={`w-full font-semibold py-4 px-6 rounded-lg shadow-md focus:outline-none focus:ring-4 transition-colors duration-200 ${selectedCategory === 'Civil Registry' ? 'bg-green-600 text-white focus:ring-green-300' : 'bg-gray-200 text-gray-800 focus:ring-gray-300'}`}
                >
                  Civil Registry
                </button>
                <button
                  onClick={() => setSelectedCategory('Taxation & Fees')}
                  className={`w-full font-semibold py-4 px-6 rounded-lg shadow-md focus:outline-none focus:ring-4 transition-colors duration-200 ${selectedCategory === 'Taxation & Fees' ? 'bg-green-600 text-white focus:ring-green-300' : 'bg-gray-200 text-gray-800 focus:ring-gray-300'}`}
                >
                  Taxation & Fees
                </button>
                <button
                  onClick={() => setSelectedCategory('Licensing')}
                  className={`w-full font-semibold py-4 px-6 rounded-lg shadow-md focus:outline-none focus:ring-4 transition-colors duration-200 ${selectedCategory === 'Licensing' ? 'bg-green-600 text-white focus:ring-green-300' : 'bg-gray-200 text-gray-800 focus:ring-gray-300'}`}
                >
                  Licensing
                </button>
                <button
                  onClick={() => setSelectedCategory('Business & Permits')}
                  className={`w-full font-semibold py-4 px-6 rounded-lg shadow-md focus:outline-none focus:ring-4 transition-colors duration-200 ${selectedCategory === 'Business & Permits' ? 'bg-green-600 text-white focus:ring-green-300' : 'bg-gray-200 text-gray-800 focus:ring-gray-300'}`}
                >
                  Business & Permits
                </button>
              </div>

              {/* Right Content Area for Documents */}
              <div className="w-full sm:w-3/4 flex flex-col items-center text-center ">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Select Document to Pay</h2>
                {/* Search bar */}
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                  type="text"
                  placeholder="Search Document..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {/* City of Dasmariñas Logo */}
                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="w-40 h-40 rounded-full mb-2 flex items-center justify-center overflow-hidden">
                    <img src="../src/assets/images/dasma_seal.png" alt="City of Dasmariñas Seal" className="w-full h-full object-contain p-2" />
                  </div>
    
                </div>
                {/* Document buttons grid */}
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map(doc => (
                      <button
                        key={doc.name}
                        onClick={() => handleDocumentSelect(doc.name)}
                        className="bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 min-w-[150px]"
                      >
                        {doc.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-500">No documents found.</p>
                  )}
                </div>
                <button
                  onClick={handleBack}
                  className="w-full max-w-xs bg-gray-200 text-gray-600 font-bold py-3 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl transition-all duration-300 text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Payment</h2>
              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <p className="text-xl font-bold">Fee Breakdown</p>
                <p className="text-lg">Document: {formData.document}</p>
                <p className="text-lg font-bold">Total: ₱{getFee().toFixed(2)}</p>
              </div>
              <div className="mb-6">
                {/* Placeholder for PayMongo QR Code / Payment Gateway */}
                <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 mb-4">
                  QR Code Here
                </div>
                <p className="text-sm text-gray-600">Scan to pay with GCash/PayMaya/Card</p>
              </div>
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleBack}
                  className="w-full bg-gray-200 text-gray-600 font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={paymentStatus === 'processing'}
                  className={`w-full font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 ${paymentStatus === 'processing'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-300'
                    }`}
                >
                  {paymentStatus === 'processing' ? 'Processing Payment...' : 'Pay Now'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'confirmation':
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
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-lg shadow-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
                >
                  Back
                </button>
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

      case 'home':
      default:
        return (
          <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-green-800 mb-8 sm:mb-12">
              Welcome
            </h1>
            <div className="flex flex-col space-y-4 w-full max-w-sm sm:max-w-md">
              <button
                onClick={() => handleNext('personalInfo')}
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
    }
  };

  return (
    <div className="min-h-screen bg-[#EBEBF2] font-sans text-gray-800 flex flex-col justify-center items-center p-4">
      <style>
        {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
                .logo-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .logo-circle {
                    width: 80px;
                    height: 80px;
                    background-color: #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    color: #4f46e5;
                }
                `}
      </style>
      <script src="https://cdn.tailwindcss.com"></script>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <div className="flex flex-col items-center justify-center w-full max-w-6xl min-h-screen">
        {renderScreen()}
      </div>
    </div>
  );
};

export default App;
