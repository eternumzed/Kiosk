import { useState, useEffect } from "react";
import CameraModal from "./CameraModal";
import KeyboardInput from './KeyboardInput';
import { useKeyboard } from '../context/KeyboardContext';

const TEMPLATES_REQUIRING_PHOTO = [
    'Barangay Clearance',
    'Barangay Indigency Certificate',
    'Barangay Residency Certificate'
];
 
const documents = {
    "Barangay Clearance": [
        { label: 'Full Name', key: 'fullName' },
        { label: 'Citizenship', key: 'citizenship' },
        { label: 'Civil Status', key: 'civilStatus' },
        { label: 'Age', key: 'age' },
        { label: 'Purpose', key: 'purpose' },
    ],
    "Barangay Indigency Certificate": [
        { label: 'Full Name', key: 'fullName' },
        { label: 'Age', key: 'age' },
        { label: 'Purpose', key: 'purpose' },
    ],
    "First Time Job Seeker Certificate": [
        { label: 'Full Name', key: 'fullName' },
        { label: 'Zone', key: 'zone' },
        { label: 'Length of Residency', key: 'lengthOfResidency' },
    ],
    "Barangay Work Permit": [
        { label: 'Full Name', key: 'fullName' },
    ],
    "Barangay Residency Certificate": [
        { label: 'Full Name', key: 'fullName' },
        { label: 'Zone', key: 'zone' },
        { label: 'Purpose', key: 'purpose' },
    ],
    "Certificate of Good Moral Character": [
        { label: 'Full Name', key: 'fullName' },
        { label: 'Civil Status', key: 'civilStatus' },
    ],
    "Barangay Business Permit": [
        { label: 'Business Name', key: 'businessName' },
        { label: 'Business Kind', key: 'businessKind' },
        { label: 'Business Address', key: 'address' },
        { label: 'Owner / Full Name', key: 'fullName' },
    ],
    "Barangay Building Clearance": [
        { label: 'Full Name', key: 'fullName' },
        { label: 'Age', key: 'age' },
        { label: 'Sex', key: 'sex' },
        { label: 'Address', key: 'address' },
        { label: 'Project Type', key: 'projectType' },
    ],
};

export default function DocumentForm({ type, formData, setFormData, handleNext, handleBack }) {
    const fields = documents[type] || [];
    const requiresPhoto = TEMPLATES_REQUIRING_PHOTO.includes(type);
    const { hideKeyboard } = useKeyboard();
    
    // Calculate total steps (fields + photo if required)
    const photoStep = requiresPhoto ? 1 : 0;
    const totalSteps = fields.length + photoStep;
    
    const [currentStep, setCurrentStep] = useState(0);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [isReviewMode, setIsReviewMode] = useState(false);

    useEffect(() => {
        return () => {
            hideKeyboard();
        };
    }, [hideKeyboard]);

    const handleChange = (key, value) => {
        const newFormData = { ...formData, [key]: value };
        setFormData(newFormData);
    };

    const handleCameraCapture = (imageData) => {
        if (imageData) {
            handleChange('photoId', imageData);
        }
        setIsCameraModalOpen(false);
        hideKeyboard();
    };

    const goNext = () => {
        // Check if current field is filled
        if (currentStep < photoStep) {
            // Photo step
            if (!formData.photoId) {
                alert('Please capture your photo to proceed.');
                return;
            }
        } else {
            // Text field step
            const fieldIndex = currentStep - photoStep;
            const field = fields[fieldIndex];
            if (!formData[field.key]) {
                alert(`Please fill in ${field.label}`);
                return;
            }
        }

        hideKeyboard();

        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // All fields filled, go to review
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

                    {/* Photo Section */}
                    {requiresPhoto && formData.photoId && (
                        <div className="mb-8 p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Photo ID</h3>
                            <div className="flex items-center justify-between">
                                <img 
                                    src={formData.photoId} 
                                    alt="Captured ID" 
                                    className="rounded-xl shadow-md w-32 h-32 object-cover border-2 border-emerald-300"
                                />
                                <button
                                    onClick={() => editField(0)}
                                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-95 transition-all duration-200 font-semibold"
                                >
                                    Retake
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Fields Section */}
                    <div className="space-y-4 mb-8">
                        {fields.map((field, index) => (
                            <div key={field.key} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{field.label}</p>
                                    <p className="text-lg font-bold text-gray-800 mt-1">{formData[field.key] || '-'}</p>
                                </div>
                                <button
                                    onClick={() => editField(photoStep + index)}
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
                            Proceed to Payment
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Single Field Mode
    const isPhotoStep = currentStep < photoStep;
    const fieldIndex = currentStep - photoStep;
    const currentField = !isPhotoStep ? fields[fieldIndex] : null;
    const progressPercent = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="w-full flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-xl border border-gray-100">
                
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{type}</h2>
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
                    
                    {/* Photo Step */}
                    {isPhotoStep && (
                        <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                            <label className="block text-lg font-semibold text-gray-700 mb-4">
                                Photo ID <span className="text-red-500">*</span>
                            </label>
                            {formData.photoId ? (
                                <div className="space-y-4">
                                    <img 
                                        src={formData.photoId} 
                                        alt="Captured ID" 
                                        className="rounded-xl shadow-md w-40 h-40 object-cover mx-auto border-2 border-emerald-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsCameraModalOpen(true)}
                                        className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 font-semibold"
                                    >
                                        Retake Photo
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsCameraModalOpen(true)}
                                    className="w-full px-4 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-3"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Capture Photo</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Text Field Step */}
                    {!isPhotoStep && currentField && (
                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-3">
                                {currentField.label} <span className="text-red-500">*</span>
                            </label>
                            <KeyboardInput
                                type="text"
                                placeholder={`Enter ${currentField.label}`}
                                value={formData[currentField.key] || ''}
                                onChange={(value) => handleChange(currentField.key, value)}
                                autoFocus={true}
                            />
                        </div>
                    )}

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

            {/* Camera Modal */}
            <CameraModal
                isOpen={isCameraModalOpen}
                onClose={() => setIsCameraModalOpen(false)}
                onCapture={handleCameraCapture}
            />
        </div>
    );
}