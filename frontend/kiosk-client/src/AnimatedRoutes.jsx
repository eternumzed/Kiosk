import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import PersonalInfo from "./components/PersonalInfo";
import SelectDocument from "./components/SelectDocument";
import Payment from "./components/Payment";
import Confirmation from "./components/Confirmation";
import Home from "./components/Home";
import TrackRequest from "./components/TrackRequest";
import Help from "./components/Help";

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
  resetUI,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* HOME */}
        <Route
          path="/"
          element={<PageTransition><Home /></PageTransition>} />
        {/* TRACK REQUEST */}
        <Route
          path="/track-request"
          element={<PageTransition><TrackRequest /></PageTransition>}
        />
        {/* HELP */}
        <Route
          path="/help"
          element={<PageTransition>
            <Help
              handleBack={() => navigate("/")}
            />
          </PageTransition>}></Route>
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
                    selectedCategory === "All" || doc.category === selectedCategory
                )}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                handleDocumentSelect={(doc) =>
                  setFormData({
                    ...formData,
                    document: doc.name,
                    amount: doc.fee,
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
                handlePayment={handlePayment}
                handleBack={() => navigate("/select-document")}
              />
            </PageTransition>
          }
        />
        {/* CONFIRMATION */}
        <Route
          path="/confirmation"
          element={<PageTransition><Confirmation
            requestRef={requestRef}
            resetUI={resetUI}
            handleNext={() => {
              navigate("/")
            }}
          /></PageTransition>}
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;