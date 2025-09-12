/* src/components/PersonalInfo.jsx */
import React from 'react';


const PersonalInfo = ({ formData, handleFormChange, handleNext, handleBack }) => {
    return (
        <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Personal Information</h2>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
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
                        type="tel"
                        name="contactNumber"
                        placeholder="Contact Number"
                        value={formData.contactNumber}
                        onChange={handleFormChange}
                        required
                    />
                    <select
                        name="barangay"
                        value={formData.barangay}
                        onChange={handleFormChange}
                        className={`w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 ${formData.barangay ? 'text-black' : 'text-gray-400'}`}
                        required
                    ><option value="">Select Barangay</option>
                        <option value="Burol I">Burol I</option>
                        <option value="Burol II">Burol II</option>
                        <option value="Burol III">Burol III</option>
                        <option value="Datu Esmael">Datu Esmael</option>
                        <option value="Emmanuel Bergado I">Emmanuel Bergado I</option>
                        <option value="Emmanuel Bergado II">Emmanuel Bergado II</option>
                        <option value="Fatima I">Fatima I</option>
                        <option value="Fatima II">Fatima II</option>
                        <option value="Fatima III">Fatima III</option>
                        <option value="H-2">H-2</option>
                        <option value="Langkaan I">Langkaan I</option>
                        <option value="Langkaan II">Langkaan II</option>
                        <option value="Luzviminda I">Luzviminda I</option>
                        <option value="Luzviminda II">Luzviminda II</option>
                        <option value="Paliparan I">Paliparan I</option>
                        <option value="Paliparan II">Paliparan II</option>
                        <option value="Paliparan III">Paliparan III</option>
                        <option value="Sabang">Sabang</option>
                        <option value="Salawag">Salawag</option>
                        <option value="Salitran I">Salitran I</option>
                        <option value="Salitran II">Salitran II</option>
                        <option value="Salitran III">Salitran III</option>
                        <option value="Salitran IV">Salitran IV</option>
                        <option value="San Agustin I">San Agustin I</option>
                        <option value="San Agustin II">San Agustin II</option>
                        <option value="San Agustin III">San Agustin III</option>
                        <option value="San Andres I">San Andres I</option>
                        <option value="San Andres II">San Andres II</option>
                        <option value="San Antonio de Padua I">San Antonio de Padua I</option>
                        <option value="San Antonio de Padua II">San Antonio de Padua II</option>
                        <option value="San Dionisio">San Dionisio</option>
                        <option value="San Esteban">San Esteban</option>
                        <option value="San Francisco I">San Francisco I</option>
                        <option value="San Francisco II">San Francisco II</option>
                        <option value="San Isidro Labrador I">San Isidro Labrador I</option>
                        <option value="San Isidro Labrador II">San Isidro Labrador II</option>
                        <option value="San Jose">San Jose</option>
                        <option value="San Juan">San Juan</option>
                        <option value="San Lorenzo Ruiz I">San Lorenzo Ruiz I</option>
                        <option value="San Lorenzo Ruiz II">San Lorenzo Ruiz II</option>
                        <option value="San Luis I">San Luis I</option>
                        <option value="San Luis II">San Luis II</option>
                        <option value="San Manuel I">San Manuel I</option>
                        <option value="San Manuel II">San Manuel II</option>
                        <option value="San Marino">San Marino</option>
                        <option value="San Mateo">San Mateo</option>
                        <option value="San Miguel">San Miguel</option>
                        <option value="San Nicolas I">San Nicolas I</option>
                        <option value="San Nicolas II">San Nicolas II</option>
                        <option value="San Roque">San Roque</option>
                        <option value="San Simon">San Simon</option>
                        <option value="Santa Cristina I">Santa Cristina I</option>
                        <option value="Santa Cristina II">Santa Cristina II</option>
                        <option value="Santa Cruz I">Santa Cruz I</option>
                        <option value="Santa Cruz II">Santa Cruz II</option>
                        <option value="Santa Fe">Santa Fe</option>
                        <option value="Santa Lucia">Santa Lucia</option>
                        <option value="Santa Maria">Santa Maria</option>
                        <option value="Santo Cristo">Santo Cristo</option>
                        <option value="Santo Niño I">Santo Niño I</option>
                        <option value="Santo Niño II">Santo Niño II</option>
                        <option value="Santo Niño III">Santo Niño III</option>
                        <option value="Victoria Reyes">Victoria Reyes</option>
                    </select><div className="text-sm text-gray-500">

                    </div>


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
        </div>
    );
};


export default PersonalInfo;