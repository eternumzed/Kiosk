import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

const CameraCapture = ({ onCapture, capturedImage }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const streamRef = useRef(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [confirmTimer, setConfirmTimer] = useState(null);

    useEffect(() => {
        loadModels();
        return () => {
            stopCamera();
        };
    }, []);

    // Timer countdown for preview
    useEffect(() => {
        if (previewImage && confirmTimer !== null && confirmTimer > 0) {
            const interval = setTimeout(() => {
                setConfirmTimer(confirmTimer - 1);
            }, 1000);
            return () => clearTimeout(interval);
        } else if (previewImage && confirmTimer === 0) {
            // Auto-confirm after timer expires
            confirmCapture();
        }
    }, [previewImage, confirmTimer]);

    const loadModels = async () => {
        try {
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
            setModelsLoaded(true);
        } catch (err) {
            console.error('Error loading face detection models:', err);
            setError('Failed to load face detection. Camera will still work.');
            setModelsLoaded(false);
        }
    };

    const startCamera = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsCameraActive(true);
                
                videoRef.current.onloadedmetadata = () => {
                    setIsLoading(false);
                    if (modelsLoaded) {
                        detectFace();
                    }
                };
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Unable to access camera. Please ensure camera permissions are granted.');
            setIsLoading(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
        setFaceDetected(false);
    };

    const detectFace = async () => {
        if (!videoRef.current || !modelsLoaded || !isCameraActive) return;

        const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks(true);

        if (canvasRef.current && videoRef.current) {
            const displaySize = {
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight
            };
            faceapi.matchDimensions(canvasRef.current, displaySize);
            
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            if (detections.length > 0) {
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                
                // Check if face is roughly facing forward by analyzing landmarks
                const landmarks = resizedDetections[0].landmarks;
                const isFacingForward = checkFacingForward(landmarks);
                
                setFaceDetected(isFacingForward);

                // Draw detection box and landmarks
                resizedDetections.forEach(detection => {
                    const box = detection.detection.box;
                    ctx.strokeStyle = isFacingForward ? '#22c55e' : '#ef4444';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(box.x, box.y, box.width, box.height);
                });
            } else {
                setFaceDetected(false);
            }
        }

        if (isCameraActive) {
            requestAnimationFrame(detectFace);
        }
    };

    const checkFacingForward = (landmarks) => {
        // Simple check: compare eye and nose positions to determine if face is frontal
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // Calculate horizontal symmetry
        const noseMidX = nose[3].x; // Nose tip
        const leftEyeX = leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length;
        const rightEyeX = rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length;
        const eyesMidX = (leftEyeX + rightEyeX) / 2;

        // If nose is roughly between eyes, face is frontal
        const symmetry = Math.abs(noseMidX - eyesMidX);
        const faceWidth = Math.abs(rightEyeX - leftEyeX);
        
        return symmetry < faceWidth * 0.2; // 20% tolerance
    };

    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current) return;

        // Create a square canvas (1:1 aspect ratio)
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        const squareSize = Math.min(videoWidth, videoHeight);
        
        // Calculate crop position to center the square
        const offsetX = (videoWidth - squareSize) / 2;
        const offsetY = (videoHeight - squareSize) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = squareSize;
        canvas.height = squareSize;
        const ctx = canvas.getContext('2d');
        
        // Draw the centered square crop from the video
        ctx.drawImage(
            videoRef.current,
            offsetX, offsetY, squareSize, squareSize,  // Source rectangle
            0, 0, squareSize, squareSize                // Destination rectangle
        );
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setPreviewImage(imageData);
        setConfirmTimer(5); // 5 second countdown
        stopCamera();
    };

    const confirmCapture = () => {
        onCapture(previewImage);
        setPreviewImage(null);
        setConfirmTimer(null);
    };

    const retakePhoto = () => {
        setPreviewImage(null);
        setConfirmTimer(null);
        startCamera();
    };

    if (capturedImage) {
        return (
            <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                    <img 
                        src={capturedImage} 
                        alt="Captured" 
                        className="rounded-lg shadow-lg max-w-sm w-full"
                    />
                </div>
                <button
                    type="button"
                    onClick={retakePhoto}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
                >
                    Retake Photo
                </button>
            </div>
        );
    }

    if (previewImage) {
        return (
            <div className="flex flex-col items-center space-y-4">
                <div className="relative w-full max-w-sm">
                    <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="rounded-lg shadow-lg w-full"
                    />
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold">
                        Preview
                    </div>
                </div>
                
                {/* Timer Display */}
                <div className="flex items-center justify-center space-x-2">
                    <svg className="w-6 h-6 text-blue-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-semibold text-gray-700">
                        Auto-confirming in {confirmTimer}s
                    </span>
                </div>

                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={retakePhoto}
                        className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-all duration-200"
                    >
                        Retake
                    </button>
                    <button
                        type="button"
                        onClick={confirmCapture}
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center space-y-4">
            {!isCameraActive ? (
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-full max-w-sm h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <button
                        type="button"
                        onClick={startCamera}
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200"
                    >
                        Start Camera
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center space-y-4">
                    {isLoading && (
                        <div className="text-gray-600">Loading camera...</div>
                    )}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}
                    
                    <div className="relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="rounded-lg shadow-lg max-w-sm w-full"
                            style={{ display: isLoading ? 'none' : 'block' }}
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 rounded-lg"
                            style={{ display: isLoading ? 'none' : 'block' }}
                        />
                    </div>

                    {modelsLoaded && !isLoading && (
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                            faceDetected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                {faceDetected ? (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                ) : (
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                )}
                            </svg>
                            <span className="text-sm font-medium">
                                {faceDetected ? 'Face detected - Ready!' : 'Please face the camera'}
                            </span>
                        </div>
                    )}

                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={stopCamera}
                            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={captureImage}
                            disabled={modelsLoaded && !faceDetected}
                            className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                                modelsLoaded && !faceDetected
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            Capture Photo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CameraCapture;
