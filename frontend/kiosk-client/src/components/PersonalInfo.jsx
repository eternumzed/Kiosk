import { useState, useEffect } from 'react';
import KeyboardInput from './KeyboardInput';
import { useKeyboard } from '../context/KeyboardContext';

const PersonalInfo = ({ formData, handleFormChange, handleNext, handleBack }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const { hideKeyboard } = useKeyboard();

    // Step 0: Full Name (required)
    // Step 1: Email & Contact Number (both optional - system email used for PayMongo if none provided)
    const totalSteps = 2;
    
    // Fallback email for PayMongo when user doesn't have one
    const KIOSK_FALLBACK_EMAIL = 'walkin.kiosk@barangay.gov.ph';

    useEffect(() => {
        return () => {
            hideKeyboard();
        };
    }, [hideKeyboard]);

    const handleChange = (key, value) => {
        handleFormChange({ target: { name: key, value } });
    };

    // Handle email change - add @gmail.com default if user types without @
    const handleEmailChange = (value) => {
        handleFormChange({ target: { name: 'email', value } });
    };

    // Add @gmail.com suffix when leaving email field if needed
    const appendGmailDefault = () => {
        const email = formData.email || '';
        if (email && !email.includes('@')) {
            handleFormChange({ target: { name: 'email', value: email + '@gmail.com' } });
        }
    };

    const goNext = () => {
        // Step 0: Full Name is required
        if (currentStep === 0 && !formData.fullName) {
            alert('Please fill in your Full Name');
            return;
        }

        // Step 1: Email and Contact are optional
        if (currentStep === 1) {
            appendGmailDefault();
            // If no email provided, use fallback for PayMongo
            if (!formData.email) {
                handleFormChange({ target: { name: 'email', value: KIOSK_FALLBACK_EMAIL } });
            }
        }

        hideKeyboard();

        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setIsReviewMode(true);
        }
    };

    const goPrevious = () => {
        hideKeyboard();
        
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            handleBack();
        }
    };

    const editField = (stepIndex) => {
        hideKeyboard();
        setCurrentStep(stepIndex);
        setIsReviewMode(false);
    };

    const submitForm = () => {
        hideKeyboard();
        handleNext();
    };

    // Review Mode
    if (isReviewMode) {
        const reviewFields = [
            { label: 'Full Name', key: 'fullName', required: true },
            { label: 'Email', key: 'email', required: false },
            { label: 'Contact Number', key: 'contactNumber', required: false },
        ];

        // Check if using fallback email
        const isUsingFallbackEmail = formData.email === KIOSK_FALLBACK_EMAIL;

        return (
            <div className="w-full flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-2xl border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Review Your Information</h1>
                    <p className="text-gray-500 text-center mb-8">Please verify all information is correct</p>

                    <div className="space-y-4 mb-8">
                        {reviewFields.map((field, index) => (
                            <div key={field.key} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                        {field.label}
                                        {!field.required && <span className="text-gray-400 ml-1">(Optional)</span>}
                                    </p>
                                    <p className="text-lg font-bold text-gray-800 mt-1">
                                        {field.key === 'email' && isUsingFallbackEmail 
                                            ? <span className="text-gray-400 italic">Not provided (using kiosk receipt)</span>
                                            : (formData[field.key] || '-')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => editField(field.key === 'fullName' ? 0 : 1)}
                                    className="ml-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-95 transition-all duration-200 font-semibold"
                                >
                                    Edit
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex space-x-4">
                        <button
                            onClick={() => setIsReviewMode(false)}
                            className="w-1/2 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 border border-gray-200"
                        >
                            Back to Form
                        </button>
                        <button
                            onClick={submitForm}
                            className="w-1/2 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200"
                        >
                            Proceed to Next
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const progressPercent = ((currentStep + 1) / totalSteps) * 100;

    // Step 0: Full Name
    if (currentStep === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-xl border border-gray-100">
                    
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                        <p className="text-gray-500 mt-1">Step {currentStep + 1} of {totalSteps}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
                        
                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-3">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <KeyboardInput
                                type="text"
                                placeholder="Enter your full name"
                                value={formData.fullName || ''}
                                onChange={(value) => handleChange('fullName', value)}
                                autoFocus={true}
                            />
                        </div>

                        <div className="flex space-x-4 pt-4">
                            <button
                                type="button"
                                onClick={goPrevious}
                                className="w-1/2 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 border border-gray-200"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="w-1/2 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200"
                            >
                                Next
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Step 1: Email & Contact Number (both optional)
    return (
        <div className="w-full flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-xl border border-gray-100">
                
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Contact Information</h2>
                    <p className="text-gray-500 mt-1">Step {currentStep + 1} of {totalSteps}</p>
                    <p className="text-sm text-gray-400 mt-2">Optional for walk-in customers</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
                    
                    <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-3">
                            Email Address <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                        </label>
                        <KeyboardInput
                            type="email"
                            placeholder="Enter your email (e.g., yourname)"
                            value={formData.email || ''}
                            onChange={handleEmailChange}
                            autoFocus={true}
                        />
                        <p className="text-sm text-gray-400 mt-2">Leave blank if you don't have email - you'll receive a printed receipt instead</p>
                    </div>

                    <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-3">
                            Contact Number <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                        </label>
                        <KeyboardInput
                            type="tel"
                            placeholder="Enter your contact number"
                            value={formData.contactNumber || ''}
                            onChange={(value) => handleChange('contactNumber', value)}
                        />
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={goPrevious}
                            className="w-1/2 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 border border-gray-200"
                        >
                            Previous
                        </button>
                        <button
                            type="submit"
                            className="w-1/2 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200"
                        >
                            Review
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PersonalInfo;