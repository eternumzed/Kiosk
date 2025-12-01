import { useState } from "react";
 
const documents = {
    "Barangay Clearance": ["Full Name", "Address", "Purpose"],
    "Barangay Indigency Certificate": ["Full Name", "Address", "Reason for Request"],
    "First Time Job Seeker Certificate": ["Full Name", "Address", "Barangay ID / Valid ID"],
    "Barangay Work Permit": ["Full Name", "Employer", "Job Title"],
    "Barangay Residency Certificate": ["Full Name", "Years of Residency"],
    "Certificate of Good Moral Character": ["Full Name", "School / Company", "Purpose"],
    "Barangay Business Permit": ["Business Name", "Owner", "Business Address"],
    "Barangay Building Clearance": ["Full Name", "Project Type", "Project Location"]
};

 
const toCamelCase = (str) => {
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
};

export default function DocumentForm({ type, handleNext, handleBack }) {
    const fields = documents[type] || [];

 
    const [formData, setFormData] = useState(() => {
        const savedData = localStorage.getItem('documentRequestFormData');
        const initialData = savedData ? JSON.parse(savedData) : {};

       
        const state = {};
        fields.forEach(fieldTitle => {
            const fieldKey = toCamelCase(fieldTitle);
        
            state[fieldKey] = initialData[fieldKey] || '';
        });
 
        return { ...initialData, ...state };
    });

    const handleChange = (fieldTitle, value) => {
 
        const fieldKey = toCamelCase(fieldTitle);

        const newFormData = { ...formData, [fieldKey]: value };
        setFormData(newFormData);

   
        localStorage.setItem('documentRequestFormData', JSON.stringify(newFormData));
    };

    return (
        <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg transition-all duration-300">

                <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center border-b pb-3">   {type} Form</h1>

                <form className="space-y-6">
                    {fields.map((fieldTitle) => {
                        const fieldKey = toCamelCase(fieldTitle); 
                        const inputId = fieldTitle.replace(/\s+/g, '-').toLowerCase();

                        return (
                            <div key={fieldTitle} className="relative">
                                <label
                                    className="block text-sm font-semibold text-gray-700 mb-1"
                                    htmlFor={inputId}
                                >
                                    {fieldTitle}
                                </label>
                                <input
                                    id={inputId}
                                    type="text"
                                    placeholder={`Enter ${fieldTitle}`}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ease-in-out placeholder-gray-400"
                                
                                    value={formData[fieldKey] || ''}
                                    onChange={(e) => handleChange(fieldTitle, e.target.value)}
                                    required
                                />
                            </div>
                        );
                    })}

                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="w-full sm:w-1/2 bg-gray-200 text-gray-600 font-bold py-3 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-gray-300"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            className="w-full sm:w-1/2 bg-green-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-300"
                            onClick={() => {
                                console.log(formData)
                                handleNext(formData); 
                            }}
                        >
                            Next
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}