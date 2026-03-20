import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

import AnimatedRoutes from "./AnimatedRoutes";
import LanguageSwitcher from "./components/LanguageSwitcher";
import AssistanceButton from "./components/AssistanceButton";

// API URL from environment variable
const API_URL = 'https://api.brgybiluso.me/api';
import { KeyboardProvider, useKeyboard } from "./context/KeyboardContext";
import VirtualKeyboard from "./components/VirtualKeyboard";
import brgyBilusoSeal from "./assets/images/BRGY_BILUSO_SEAL.jpg";

const documents = [
  { name: "Barangay Clearance", fee: 50, category: "Clearance" },
  { name: "Barangay Indigency Certificate", fee: 0, category: "Certification" },
  { name: "First Time Job Seeker Certificate", fee: 0, category: "Certification" },
  { name: "Barangay Work Permit", fee: 100, category: "Permit" },
  { name: "Barangay Residency Certificate", fee: 50, category: "Certification" },
  { name: "Certificate of Good Moral Character", fee: 50, category: "Certification" },
  { name: "Barangay Business Permit", fee: 300, category: "Permit" },
  { name: "Barangay Building Clearance", fee: 300, category: "Permit" },
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

  const getRequestReferenceNumber = () => {
    if (typeof requestRef === 'string') return '';
    if (!requestRef || typeof requestRef !== 'object') return '';
    return requestRef.reference || requestRef.referenceNumber || '';
  };

  const normalizeBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === 'yes' || normalized === 'y' || normalized === '1';
    }
    if (typeof value === 'number') return value === 1;
    return false;
  };

  const isWorkPurpose = (value) => {
    const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return /(work|job|employment|trabaho|hanapbuhay|apply|application)/i.test(text);
  };

  const getFee = () => {
    const docName = (formData.document || '').trim().toLowerCase();
    if (docName === 'barangay indigency certificate') return 0;
    if (docName === 'first time job seeker certificate') return 0;
    if (docName === 'barangay residency certificate') return 50;

    if (docName === 'barangay clearance') {
      const student = normalizeBoolean(formData.isStudent);
      if (student && !isWorkPurpose(formData.purpose)) {
        return 0;
      }
      return 50;
    }

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

  const handleFreePayment = async () => {
    try {
      setPaymentStatus("Processing");

      const paymentData = {
        ...formData,
        amount: getFee(),
        paymentMethod: 'Free',
      };
      console.log('Creating free request:', paymentData);

      const res = await axios.post(`${API_URL}/payment/create-cash-payment`, paymentData);

      if (res.data.referenceNumber) {
        setRequestRef({
          reference: res.data.referenceNumber,
        });

        window.location.href = `/confirmation?referenceNumber=${res.data.referenceNumber}`;
      } else {
        throw new Error("Reference number missing");
      }
    } catch (err) {
      console.error("Free request error:", err.response?.data || err.message);
      setPaymentStatus("Failed");
    }
  };

  const handleRequestAssistance = async (currentPath) => {
    const assistanceData = {
      fullName: formData.fullName || '',
      document: formData.document || '',
      referenceNumber: getRequestReferenceNumber(),
      currentPath: currentPath || '',
    };

    await axios.post(`${API_URL}/request/request-assistance`, assistanceData);
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
          handleFreePayment={handleFreePayment}
          resetUI={resetUI}
          handleRequestAssistance={handleRequestAssistance}
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
  handleFreePayment,
  resetUI,
  handleRequestAssistance,
}) => {
  const location = useLocation();
  const { isVisible, handleKeyPress, handleBackspace, handleEnter, hideKeyboard } = useKeyboard();
  const isPublicStatusView = location.pathname.startsWith('/queue') || location.pathname.startsWith('/request-status');
  const showPersistentLanguageSwitcher = !isPublicStatusView && location.pathname !== '/';
  const showPersistentAssistanceButton = !isPublicStatusView && location.pathname !== '/';

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 font-sans text-gray-800 flex flex-col overflow-hidden">
      {!isPublicStatusView && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
          <img
            src={brgyBilusoSeal}
            alt="BRGY Biluso Seal"
            className="w-[150vmin] max-w-[700px] opacity-10"
            draggable={false}
          />
        </div>
      )}
      {showPersistentLanguageSwitcher && <LanguageSwitcher />}
      {showPersistentAssistanceButton && (
        <AssistanceButton onRequestAssistance={() => handleRequestAssistance(location.pathname)} />
      )}
      <div className={`relative z-10 flex-grow ${isPublicStatusView ? '' : `flex flex-col justify-center items-center p-6 ${isVisible ? 'pb-80' : ''}`}`}>
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
          handleFreePayment={handleFreePayment}
          resetUI={resetUI}
        />
      </div>
      {!isPublicStatusView && (
        <VirtualKeyboard
          visible={isVisible}
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onEnter={handleEnter}
          onClose={hideKeyboard}
        />
      )}
    </div>
  );
};

export default App;