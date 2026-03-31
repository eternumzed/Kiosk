import { Navigate, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import PersonalInfo from "./components/PersonalInfo";
import SelectDocument from "./components/SelectDocument";
import DocumentForm from "./components/DocumentForm";
import Payment from "./components/Payment";
import Confirmation from "./components/Confirmation";
import Home from "./components/Home";
import TrackRequest from "./components/TrackRequest";
import Help from "./components/Help";
import LanguageSelect from "./components/LanguageSelect";
import QueueDisplay from "./components/QueueDisplay";
import RequestStatusPage from "./components/RequestStatusPage";


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
  paymentError,
  setPaymentError,
  requestRef,
  setRequestRef,
  selectedCategory,
  setSelectedCategory,
  getFee,
  handlePayment,
  handleCashPayment,
  handleFreePayment,
  resetUI,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isQueueHost = typeof window !== 'undefined' && window.location.hostname.startsWith('queue.');

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* LANGUAGE SELECT */}
        <Route
          path="/"
          element={<PageTransition>{isQueueHost ? <Navigate to="/queue" replace /> : <LanguageSelect />}</PageTransition>} />
        <Route
          path="/queue"
          element={<PageTransition><QueueDisplay /></PageTransition>}
        />
        <Route
          path="/request-status"
          element={<PageTransition><RequestStatusPage /></PageTransition>}
        />

        {/* HOME */}
        <Route
          path="/home"
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
              handleBack={() => navigate("/home")}
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
                handleBack={() => navigate("/home")}
              />
            </PageTransition>
          }
        />
        {/* SELECT DOCUMENT */}
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
                formData={formData}
                handleDocumentSelect={(doc) =>
                  setFormData({
                    ...formData,
                    document: doc.name,
                    amount: doc.fee,
                  })
                }
                handleNext={() => navigate("/document-form")}
                handleBack={() => navigate("/personal-info")}
              />
            </PageTransition>
          }
        />
        {/* FORM */}

        <Route
          path="/document-form"
          element={
            <PageTransition>
              <DocumentForm
                type={formData.document}
                formData={formData}
                setFormData={setFormData}
                handleNext={() => navigate("/payment")}
                handleBack={() => navigate("/select-document")}
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
                paymentError={paymentError}
                setRequestRef={setRequestRef}
                handlePayment={handlePayment}
                handleCashPayment={handleCashPayment}
                handleFreePayment={handleFreePayment}
                handleBack={() => {
                  setPaymentStatus('Pending');
                  setPaymentError('');
                  navigate("/document-form");
                }}
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