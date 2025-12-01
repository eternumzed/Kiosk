const SelectDocument = ({ filteredDocuments, selectedCategory, setSelectedCategory, handleDocumentSelect, handleBack, handleNext }) => {
    return (
        <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-4xl transition-all duration-300 flex flex-col sm:flex-row">
                <div className="w-full sm:w-1/4 mb-6 sm:mb-0 sm:pr-8 flex flex-col items-center sm:items-start space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 hidden sm:block">Categories</h3>
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={`w-full font-semibold py-6 px-6 my-2 rounded-lg shadow-md focus:outline-none focus:ring-4 transition-colors duration-200 ${selectedCategory === 'All' ? 'bg-green-600 text-white focus:ring-green-300' : 'bg-gray-200 text-gray-800 focus:ring-gray-300'}`}
                    >
                        All Documents</button>
                    <button
                        onClick={() => setSelectedCategory('Clearance')}
                        className={`w-full font-semibold py-6 px-6 my-2 rounded-lg shadow-md focus:outline-none focus:ring-4 transition-colors duration-200 ${selectedCategory === 'Clearance' ? 'bg-green-600 text-white focus:ring-green-300' : 'bg-gray-200 text-gray-800 focus:ring-gray-300'}`}
                    >
                        Clearance
                    </button>
                    <button
                        onClick={() => setSelectedCategory('Certification')}
                        className={`w-full font-semibold py-6 px-6 my-2 rounded-lg shadow-md focus:outline-none focus:ring-4 transition-colors duration-200 ${selectedCategory === 'Certification' ? 'bg-green-600 text-white focus:ring-green-300' : 'bg-gray-200 text-gray-800 focus:ring-gray-300'}`}
                    >
                        Certification
                    </button>
                    <button
                        onClick={() => setSelectedCategory('Permit')}
                        className={`w-full font-semibold py-6 px-6 my-2 rounded-lg shadow-md focus:outline-none focus:ring-4 transition-colors duration-200 ${selectedCategory === 'Permit' ? 'bg-green-600 text-white focus:ring-green-300' : 'bg-gray-200 text-gray-800 focus:ring-gray-300'}`}
                    >
                        Permit
                    </button>
                </div>


                <div className="w-full sm:w-3/4 flex flex-col items-center text-center">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Select Document to Pay</h2>

                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="w-30 h-30 rounded-full mb-2 flex items-center justify-center overflow-hidden">
                            <img src="../src/assets/images/BRGY_BILUSO_SEAL.jpg" alt="Brgy. Biluso Seal" className="w-full h-full object-contain p-2" />
                        </div>

                    </div>


                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        {filteredDocuments.length > 0 ? (
                            filteredDocuments.map(doc => (
                                <button
                                    key={doc.name}

                                    onClick={() => { handleDocumentSelect(doc); handleNext(); }}

                                    className="bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 min-w-[150px]"
                                >
                                    {doc.name}
                                </button>
                            ))
                        ) : (
                            <p className="text-gray-500">No documents found.</p>
                        )}
                    </div>


                    <button
                        onClick={handleBack}
                        className="w-full max-w-xs bg-gray-200 text-gray-600 font-bold py-3 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105"
                    >
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
};


export default SelectDocument;