import { BrowserRouter as Router } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

import AnimatedRoutes from "./AnimatedRoutes";

const documents = [
  { name: "Cedula", fee: 50, category: "Civil Registry" },
  { name: "Birth Certificate", fee: 150, category: "Civil Registry" },
  { name: "Marriage Certificate", fee: 200, category: "Civil Registry" },
  { name: "Death Certificate", fee: 200, category: "Civil Registry" },
  { name: "Barangay Clearance", fee: 100, category: "Taxation & Fees" },
  { name: "Building Permit", fee: 500, category: "Business & Permits" },
  { name: "Health Certificate", fee: 100, category: "Licensing" },
];

const App = () => {
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('documentRequestFormData');
    return savedData ? JSON.parse(savedData) : {
      fullName: '',
      contactNumber: '',
      email: '',
      address: '',
      barangay: '',
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
      barangay: '',
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

      const res = await axios.post("http://localhost:5000/api/payment/create-checkout", {
        fullName: formData.fullName,
        contactNumber: formData.contactNumber,
        email: formData.email,
        address: formData.address,
        barangay: formData.barangay,
        document: formData.document,
        amount: getFee(),
      });

      console.log("PayMongo response:", res.data);

      if (res.data.checkoutUrl) {
        setRequestRef({
          reference: res.data.reference,
          description: res.data.description,
          amount: res.data.amount,
          currency: res.data.currency,
        });

        window.location.href = res.data.checkoutUrl;
      } else {
        throw new Error("Checkout URL missing");
      }
    } catch (err) {
      console.error("Payment error:", err.response?.data || err.message);
      setPaymentStatus("Failed");
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#EBEBF2] font-sans text-gray-800 flex flex-col justify-center items-center p-4">
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
          resetUI={resetUI}
        />
      </div>
    </Router>
  );
};

export default App;