import { BrowserRouter as Router } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

import AnimatedRoutes from "./AnimatedRoutes";

// API URL from environment variable
const API_URL = 'https://api.brgybiluso.me/api';
import { KeyboardProvider, useKeyboard } from "./context/KeyboardContext";
import VirtualKeyboard from "./components/VirtualKeyboard";
import brgyBilusoSeal from "./assets/images/BRGY_BILUSO_SEAL.jpg";

const documents = [
  { name: "Barangay Clearance", fee: 50, category: "Clearance" },
  { name: "Barangay Indigency Certificate", fee: 150, category: "Certification" },
  { name: "First Time Job Seeker Certificate", fee: 200, category: "Certification" },
  { name: "Barangay Work Permit", fee: 200, category: "Permit" },
  { name: "Barangay Residency Certificate", fee: 100, category: "Certification" },
  { name: "Certificate of Good Moral Character", fee: 500, category: "Certification" },
  { name: "Barangay Business Permit", fee: 100, category: "Permit" },
  { name: "Barangay Building Clearance", fee: 100, category: "Permit" },
];

const App = () => {
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('documentRequestFormData');
    return savedData ? JSON.parse(savedData) : {
      fullName: '',
      contactNumber: '',
      email: '',
      address: '',
      document: '',
      amount: '',
    };
  });

  const resetUI = () => {
    setFormData({
      fullName: '',
      contactNumber: '',
      email: '',
      address: '',
      document: '',
      amount: '',
    });
    setPaymentStatus('Pending');
    setRequestRef({
      reference: '',
      description: '',
      amount: '',
      currency: '',
    });
    localStorage.removeItem('documentRequestFormData');
  };

  useEffect(() => {
    localStorage.setItem('documentRequestFormData', JSON.stringify(formData));
  }, [formData]);

  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [requestRef, setRequestRef] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const getFee = () => {
    const doc = documents.find((d) => d.name === formData.document);
    return doc ? doc.fee : 0;
  };

  const handlePayment = async () => {
    try {
      setPaymentStatus("Processing");

      const paymentData = {
        ...formData,
        amount: getFee(),
      };
      console.log('Sending payment data to backend:', paymentData);

      const res = await axios.post(`${API_URL}/request/create-request`, paymentData);


      if (res.data.checkout_url) {
        setRequestRef({
          reference: res.data.reference_number,
          description: res.data.payment_intent.attributes.description,
          amount: res.data.payment_intent.attributes.amount,
          currency: res.data.payment_intent.attributes.currency,
        });
      
        window.location.href = res.data.checkout_url;
      } else {
        throw new Error("Checkout URL missing");
      }
    } catch (err) {
      console.error("Payment error:", err.response?.data || err.message);
      setPaymentStatus("Failed");
    }
  };

  const handleCashPayment = async () => {
    try {
      setPaymentStatus("Processing");

      const paymentData = {
        ...formData,
        amount: getFee(),
      };
      console.log('Creating cash payment request:', paymentData);

      const res = await axios.post(`${API_URL}/payment/create-cash-payment`, paymentData);

      if (res.data.referenceNumber) {
        setRequestRef({
          reference: res.data.referenceNumber,
        });
        
        // Navigate to confirmation page for cash payment
        window.location.href = `/confirmation?referenceNumber=${res.data.referenceNumber}`;
      } else {
        throw new Error("Reference number missing");
      }
    } catch (err) {
      console.error("Cash payment error:", err.response?.data || err.message);
      setPaymentStatus("Failed");
    }
  };

  return (
    <KeyboardProvider>
      <Router>
        <AppContent
          documents={documents}
          formData={formData}
          setFormData={setFormData}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          requestRef={requestRef}
          setRequestRef={setRequestRef}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          getFee={getFee}
          handlePayment={handlePayment}
          handleCashPayment={handleCashPayment}
          resetUI={resetUI}
        />
      </Router>
    </KeyboardProvider>
  );
};

// Separate component to use keyboard context
const AppContent = ({
  documents,
  formData,
  setFormData,
  paymentStatus,
  setPaymentStatus,
  requestRef,
  setRequestRef,
  selectedCategory,
  setSelectedCategory,
  getFee,
  handlePayment,
  handleCashPayment,
  resetUI,
}) => {
  const { isVisible, handleKeyPress, handleBackspace, handleEnter, hideKeyboard } = useKeyboard();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 font-sans text-gray-800 flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
        <img
          src={brgyBilusoSeal}
          alt="BRGY Biluso Seal"
          className="w-[150vmin] max-w-[700px] opacity-10"
          draggable={false}
        />
      </div>
      <div className={`relative z-10 flex-grow flex flex-col justify-center items-center p-6 ${isVisible ? 'pb-80' : ''}`}>
        <AnimatedRoutes
          documents={documents}
          formData={formData}
          setFormData={setFormData}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          requestRef={requestRef}
          setRequestRef={setRequestRef}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          getFee={getFee}
          handlePayment={handlePayment}
          handleCashPayment={handleCashPayment}
          resetUI={resetUI}
        />
      </div>
      <VirtualKeyboard
        visible={isVisible}
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onEnter={handleEnter}
        onClose={hideKeyboard}
      />
    </div>
  );
};

export default App;