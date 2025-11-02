import React from 'react';

// The component now accepts an 'handleBack' function as a prop
const Help = ({ handleBack }) => {
    // Reference the file placed in the 'public' folder using the root path (/)
    const videoUrl = "/kiosk-tutorial.mp4";

    return (
        <div className="w-full flex-grow flex flex-col items-center p-4 bg-gray-200">

            {/* Navigation Button Area */}
            <div className="w-full max-w-6xl pt-6 flex justify-start">
                <button
                    // Calls the handleBack prop when clicked
                    onClick={handleBack}
                    // Updated Tailwind classes for a solid black look (using gray-900)
                    className="flex items-center space-x-2 p-3 bg-gray-700 text-white font-bold rounded-xl shadow-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-gray-500 text-lg"
                    aria-label="Go Back"
                >
                    {/* Back Arrow Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back</span>
                </button>
            </div>

            {/* Video Container - Increased max-w-4xl to max-w-6xl for larger video */}
            <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl p-6 md:p-10 mt-4">
                <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg border-4 border-green-500">
                    <video
                        className="w-full h-full object-cover"
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                    >
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag. Please check the help manual.
                    </video>
                </div>
            </div>
        </div>
    );
}

export default Help;
