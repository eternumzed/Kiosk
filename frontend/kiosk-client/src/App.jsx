// App.jsx
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import axios from "axios";

import PersonalInfo from "./components/PersonalInfo";
import SelectDocument from "./components/SelectDocument";
import Payment from "./components/Payment";
import Confirmation from "./components/Confirmation";
import Home from "./components/Home";

const documents = [
  { name: "Cedula", fee: 50, category: "Civil Registry" },
  { name: "Birth Certificate", fee: 150, category: "Civil Registry" },
  { name: "Marriage Certificate", fee: 200, category: "Civil Registry" },
  { name: "Death Certificate", fee: 200, category: "Civil Registry" },
  { name: "Barangay Clearance", fee: 100, category: "Taxation & Fees" },
  { name: "Building Permit", fee: 500, category: "Business & Permits" },
  { name: "Health Certificate", fee: 100, category: "Licensing" },
];

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="w-full"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = ({
  formData,
  setFormData,
  paymentStatus,
  setPaymentStatus,
  requestRef,
  setRequestRef,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  getFee,
  handlePayment, // ✅ now passed in
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* HOME */}
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />

        {/* PERSONAL INFO */}
        <Route
          path="/personal-info"
          element={
            <PageTransition>
              <PersonalInfo
                formData={formData}
                handleFormChange={(e) =>
                  setFormData({ ...formData, [e.target.name]: e.target.value })
                }
                handleNext={() => navigate("/select-document")}
                handleBack={() => navigate("/")}
              />
            </PageTransition>
          }
        />
        <Route
          path="/select-document"
          element={
            <PageTransition>
              <SelectDocument
                filteredDocuments={documents.filter(
                  (doc) =>
                    (selectedCategory === "All" || doc.category === selectedCategory) &&
                    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
                )}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                handleDocumentSelect={(doc) =>
                  setFormData({
                    ...formData,
                    document: doc.name, // 👈 PayMongo needs this
                    amount: doc.fee,    // 👈 store fee too
                  })
                }
                handleNext={() => navigate("/payment")}
                handleBack={() => navigate("/personal-info")}
              />
            </PageTransition>
          }
        />


        {/* PAYMENT */}
        <Route
          path="/payment"
          element={
            <PageTransition>
              <Payment
                formData={formData}
                getFee={getFee}
                paymentStatus={paymentStatus}
                setPaymentStatus={setPaymentStatus}
                setRequestRef={setRequestRef}
                handlePayment={handlePayment}   // ✅ comes from App
                handleBack={() => navigate("/select-document")}
              />
            </PageTransition>
          }
        />


        {/* CONFIRMATION */}
        <Route
          path="/confirmation"
          element={<PageTransition><Confirmation requestRef={requestRef} /></PageTransition>}
        />
      </Routes>
    </AnimatePresence>
  );
};


const App = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    contactNumber: "",
    address: "",
    barangay: "",
    document: "",
  });
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [requestRef, setRequestRef] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const getFee = () => {
    const doc = documents.find((d) => d.name === formData.document);
    return doc ? doc.fee : 0;
  };


  const handlePayment = async () => {
    try {
      setPaymentStatus("processing");

      const res = await axios.post("http://localhost:5000/api/payment/create-checkout", {
        document: formData.document,
        amount: getFee(),
      });

      console.log("PayMongo response:", res.data);  // 👈 add this log

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
      setPaymentStatus("failed");
    }
  };


  return (
    <Router>
      <div className="min-h-screen bg-[#EBEBF2] font-sans text-gray-800 flex flex-col justify-center items-center p-4">
        <AnimatedRoutes
          formData={formData}
          setFormData={setFormData}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          requestRef={requestRef}
          setRequestRef={setRequestRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          getFee={getFee}
          handlePayment={handlePayment} // ✅ passed down
        />
      </div>
    </Router>
  );
};

export default App;
