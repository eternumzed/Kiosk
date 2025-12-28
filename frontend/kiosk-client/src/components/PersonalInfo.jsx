import { useState } from 'react';
import CameraModal from './CameraModal';

// Templates that require a photo ID
const TEMPLATES_REQUIRING_PHOTO = [
    'Barangay Clearance',
    'Barangay Indigency Certificate',
    'Barangay Residency Certificate'
];

const PersonalInfo = ({ formData, handleFormChange, handleNext, handleBack }) => {
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const requiresPhoto = TEMPLATES_REQUIRING_PHOTO.includes(formData.document);

    const handleCameraCapture = (imageData) => {
        if (imageData) {
            handleFormChange({ target: { name: 'photoId', value: imageData }});
        }
        setIsCameraModalOpen(false);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        // Validate photo is captured if required
        if (requiresPhoto && !formData.photoId) {
            alert('Please capture your photo to proceed.');
            return;
        }
        
        handleNext();
    };

    return (
        <div className="w-full flex-grow flex flex-col items-center justify-center p-4">

            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Personal Information</h2>
                <form className="space-y-4" onSubmit={handleFormSubmit}>
                    {/* Photo Capture Section - Only for templates that require it */}
                    {requiresPhoto && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Photo ID <span className="text-red-500">*</span>
                            </label>
                            {formData.photoId ? (
                                <div className="space-y-3">
                                    <img 
                                        src={formData.photoId} 
                                        alt="Captured ID" 
                                        className="rounded-lg shadow-md w-32 h-32 object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsCameraModalOpen(true)}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm"
                                    >
                                        Retake Photo
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsCameraModalOpen(true)}
                                    className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center justify-center space-x-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Capture Photo</span>
                                </button>
                            )}
                        </div>
                    )}

                    <input
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={handleFormChange}
                        required
                    />
                    <input
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleFormChange}
                        required
                    />
                    <input
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                        type="tel"
                        name="contactNumber"
                        placeholder="Contact Number"
                        value={formData.contactNumber}
                        onChange={handleFormChange}
                    />
                    <input
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                        type="text"
                        name="address"
                        placeholder="Address"
                        value={formData.address}
                        onChange={handleFormChange}
                    />


                    <div className="flex space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="w-full bg-gray-200 text-gray-600 font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
                        >
                            Next
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
};


export default PersonalInfo;