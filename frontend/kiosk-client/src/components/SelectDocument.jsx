const SelectDocument = ({ filteredDocuments, selectedCategory, setSelectedCategory, handleDocumentSelect, handleBack, handleNext }) => {
    return (
        <div className="w-full flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-4xl border border-gray-100 flex flex-col sm:flex-row">
                {/* Categories Sidebar */}
                <div className="w-full sm:w-1/4 mb-6 sm:mb-0 sm:pr-6 flex flex-col items-stretch space-y-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 hidden sm:block">Categories</h3>
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={`w-full font-semibold py-4 px-4 rounded-xl transition-all duration-200 ${selectedCategory === 'All' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
                    >
                        All Documents
                    </button>
                    <button
                        onClick={() => setSelectedCategory('Clearance')}
                        className={`w-full font-semibold py-4 px-4 rounded-xl transition-all duration-200 ${selectedCategory === 'Clearance' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
                    >
                        Clearance
                    </button>
                    <button
                        onClick={() => setSelectedCategory('Certification')}
                        className={`w-full font-semibold py-4 px-4 rounded-xl transition-all duration-200 ${selectedCategory === 'Certification' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
                    >
                        Certification
                    </button>
                    <button
                        onClick={() => setSelectedCategory('Permit')}
                        className={`w-full font-semibold py-4 px-4 rounded-xl transition-all duration-200 ${selectedCategory === 'Permit' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
                    >
                        Permit
                    </button>
                </div>

                {/* Documents Section */}
                <div className="w-full sm:w-3/4 flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Select Document</h2>

                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="w-24 h-24 rounded-full mb-2 flex items-center justify-center overflow-hidden bg-gray-50 border-2 border-emerald-200">
                            <img src="../src/assets/images/BRGY_BILUSO_SEAL.jpg" alt="Brgy. Biluso Seal" className="w-full h-full object-contain p-1" />
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 mb-8 w-full">
                        {filteredDocuments.length > 0 ? (
                            filteredDocuments.map(doc => (
                                <button
                                    key={doc.name}
                                    onClick={() => {
                                        handleDocumentSelect(doc);
                                        handleNext();
                                    }}
                                    className="bg-emerald-600 text-white font-semibold py-3 px-5 rounded-xl shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 min-w-[140px]"
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
                        className="w-full max-w-xs bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 border border-gray-200"
                    >
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectDocument;