import { useState, useEffect } from 'react';
import KeyboardInput from './KeyboardInput';
import { useKeyboard } from '../context/KeyboardContext';

const PersonalInfo = ({ formData, handleFormChange, handleNext, handleBack }) => {
    const fields = [
        { label: 'Full Name', key: 'fullName', type: 'text', placeholder: 'Enter your full name' },
        { label: 'Email', key: 'email', type: 'email', placeholder: 'Enter your email' },
        { label: 'Contact Number', key: 'contactNumber', type: 'tel', placeholder: 'Enter your contact number' },
        { label: 'Address', key: 'address', type: 'text', placeholder: 'Enter your address' },
    ];

    const [currentStep, setCurrentStep] = useState(0);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const { hideKeyboard } = useKeyboard();
    const totalSteps = fields.length;

    useEffect(() => {
        return () => {
            hideKeyboard();
        };
    }, [hideKeyboard]);

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
            <div className="w-full flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-2xl border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Review Your Information</h1>
                    <p className="text-gray-500 text-center mb-8">Please verify all information is correct</p>

                    <div className="space-y-4 mb-8">
                        {fields.map((field, index) => (
                            <div key={field.key} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{field.label}</p>
                                    <p className="text-lg font-bold text-gray-800 mt-1">{formData[field.key] || '-'}</p>
                                </div>
                                <button
                                    onClick={() => editField(index)}
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

    // Single Field Mode
    const currentField = fields[currentStep];
    const progressPercent = ((currentStep + 1) / totalSteps) * 100;

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
                            {currentField.label} <span className="text-red-500">*</span>
                        </label>
                        <KeyboardInput
                            type={currentField.type}
                            placeholder={currentField.placeholder}
                            value={formData[currentField.key] || ''}
                            onChange={(value) => handleChange(currentField.key, value)}
                            autoFocus={true}
                        />
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={goPrevious}
                            className="w-1/2 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 border border-gray-200"
                        >
                            {currentStep === 0 ? 'Back' : 'Previous'}
                        </button>
                        <button
                            type="submit"
                            className="w-1/2 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200"
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