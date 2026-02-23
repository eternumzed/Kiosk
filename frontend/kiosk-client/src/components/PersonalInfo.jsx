import { useState, useRef, useEffect } from 'react';

const PersonalInfo = ({ formData, handleFormChange, handleNext, handleBack }) => {
    const fields = [
        { label: 'Full Name', key: 'fullName', type: 'text', placeholder: 'Enter your full name' },
        { label: 'Email', key: 'email', type: 'email', placeholder: 'Enter your email' },
        { label: 'Contact Number', key: 'contactNumber', type: 'tel', placeholder: 'Enter your contact number' },
        { label: 'Address', key: 'address', type: 'text', placeholder: 'Enter your address' },
    ];

    const [currentStep, setCurrentStep] = useState(0);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const inputRef = useRef(null);
    const totalSteps = fields.length;

    // Hide keyboard when component unmounts
    useEffect(() => {
        return () => {
            hideKeyboard();
        };
    }, []);

    // Hide keyboard helper function
    const hideKeyboard = () => {
        if (inputRef.current) {
            inputRef.current.blur();
        }
        if (navigator.virtualKeyboard) {
            navigator.virtualKeyboard.hide().catch(() => {});
        }
    };

    const handleChange = (key, value) => {
        handleFormChange({ target: { name: key, value } });
    };

    const goNext = () => {
        const currentField = fields[currentStep];
        if (!formData[currentField.key]) {
            alert(`Please fill in ${currentField.label}`);
            return;
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
        return (
            <div className="w-full min-h-screen flex flex-col items-center justify-start p-4 pt-8">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl transition-all duration-300">
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-2 text-center">Review Your Information</h1>
                    <p className="text-gray-600 text-center mb-6">Please verify all information is correct</p>

                    <div className="space-y-4 mb-8">
                        {fields.map((field, index) => (
                            <div key={field.key} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-600">{field.label}</p>
                                    <p className="text-lg font-bold text-gray-800">{formData[field.key] || '-'}</p>
                                </div>
                                <button
                                    onClick={() => editField(index)}
                                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 whitespace-nowrap"
                                >
                                    Edit
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <button
                            onClick={() => setIsReviewMode(false)}
                            className="w-full sm:w-1/2 bg-gray-200 text-gray-600 font-bold py-3 rounded-lg hover:bg-gray-300 transition-all duration-300"
                        >
                            Back to Form
                        </button>
                        <button
                            onClick={submitForm}
                            className="w-full sm:w-1/2 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-all duration-300"
                        >
                            Proceed to Next
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Single Field Mode
    const currentField = fields[currentStep];
    const progressPercent = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-start p-4 pt-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-xl transition-all duration-300">
                
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-semibold text-gray-700">Personal Information</h2>
                        <span className="text-sm font-semibold text-gray-600">Step {currentStep + 1} of {totalSteps}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                            className="bg-green-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
                    
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 mb-3">
                            {currentField.label} <span className="text-red-500">*</span>
                        </label>
                        <input
                            ref={inputRef}
                            type={currentField.type}
                            placeholder={currentField.placeholder}
                            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ease-in-out placeholder-gray-400"
                            value={formData[currentField.key] || ''}
                            onChange={(e) => handleChange(currentField.key, e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={goPrevious}
                            className="w-full sm:w-1/2 bg-gray-200 text-gray-600 font-bold py-3 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            {currentStep === 0 ? 'Back' : 'Previous'}
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-1/2 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            {currentStep === totalSteps - 1 ? 'Review' : 'Next'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PersonalInfo;