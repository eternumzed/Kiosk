import { useState } from "react";
 
// Fields are defined with `label` shown to users and `key` expected by backend templates
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

 
const toCamelCase = (str) => {
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
};

export default function DocumentForm({ type, formData, setFormData, handleNext, handleBack }) {
    const fields = documents[type] || [];

    const handleChange = (key, value) => {
        const newFormData = { ...formData, [key]: value };
        setFormData(newFormData);
    };

    return (
        <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg transition-all duration-300">

                <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center border-b pb-3">   {type} Form</h1>

                <form className="space-y-6">
                    {fields.map((f) => {
                        const inputId = f.key.replace(/\s+/g, '-').toLowerCase();

                        return (
                            <div key={f.key} className="relative">
                                <label
                                    className="block text-sm font-semibold text-gray-700 mb-1"
                                    htmlFor={inputId}
                                >
                                    {f.label}
                                </label>
                                <input
                                    id={inputId}
                                    type="text"
                                    placeholder={`Enter ${f.label}`}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ease-in-out placeholder-gray-400"
                                    value={formData[f.key] || ''}
                                    onChange={(e) => handleChange(f.key, e.target.value)}
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
                        <div className="w-full sm:w-1/2">
                            <button
                                type="button"
                                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow-md transition-all duration-300 transform hover:bg-green-700 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-300"
                                onClick={() => handleNext(formData)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}