const APK_DOWNLOAD_URL = import.meta.env.VITE_APK_DOWNLOAD_URL || 'https://api.brgybiluso.me/download/app-release.apk';

const DownloadApp = () => {
    return (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-3xl border border-emerald-100 bg-white p-8 shadow-xl">
                <h1 className="text-3xl font-bold text-emerald-800">Barangay Biluso Mobile App</h1>
                <p className="mt-3 text-gray-600">
                    Download the latest Android APK using the button below.
                </p>

                <a
                    href={APK_DOWNLOAD_URL}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white transition-all duration-200 hover:bg-emerald-700"
                >
                    Download APK
                </a>

                <p className="mt-4 break-all text-sm text-gray-500">
                    Direct link: {APK_DOWNLOAD_URL}
                </p>
            </div>
        </div>
    );
};

export default DownloadApp;
