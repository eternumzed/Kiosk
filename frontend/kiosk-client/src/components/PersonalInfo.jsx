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
                    <select
                        name="barangay"
                        value={formData.barangay}
                        onChange={handleFormChange}
                        className={`w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 ${formData.barangay ? 'text-black' : 'text-gray-400'}`}
                        required
                    ><option value="">Select Barangay</option>
                        <option value="Aguado">Aguado</option>
                        <option value="Cabezas">Cabezas</option>
                        <option value="Cabuco">Cabuco</option>
                        <option value="Conchu">Conchu</option>
                        <option value="De Ocampo">De Ocampo</option>
                        <option value="Gregorio">Gregorio</option>
                        <option value="Hugo Perez">Hugo Perez</option>
                        <option value="Inocencio">Inocencio</option>
                        <option value="Lallana">Lallana</option>
                        <option value="Lapidario">Lapidario</option>
                        <option value="Luciano">Luciano</option>
                        <option value="Osorio">Osorio</option>
                        <option value="San Agustin">San Agustin</option>
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