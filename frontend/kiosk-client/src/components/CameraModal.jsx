import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
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
    const goodPositionFramesRef = useRef(0); // Track consecutive good frames
    const capturedRef = useRef(false); // Prevent multiple captures
    const [captureCountdown, setCaptureCountdown] = useState(null); // Countdown before auto-capture

    useEffect(() => {
        if (isOpen) {
            console.log('🎬 Modal opened - initializing camera');
            loadModels();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen]);

    // Timer countdown for preview
    useEffect(() => {
        if (previewImage && confirmTimer !== null && confirmTimer > 0) {
            const interval = setTimeout(() => {
                setConfirmTimer(confirmTimer - 1);
            }, 1000);
            return () => clearTimeout(interval);
        } else if (previewImage && confirmTimer === 0) {
            confirmCapture();
        }
    }, [previewImage, confirmTimer]);

    // Countdown before auto-capture
    useEffect(() => {
        if (captureCountdown !== null && captureCountdown > 0) {
            const interval = setTimeout(() => {
                setCaptureCountdown(captureCountdown - 1);
            }, 1000);
            return () => clearTimeout(interval);
        } else if (captureCountdown === 0 && !capturedRef.current) {
            capturedRef.current = true;
            console.log('📸 Auto-capturing photo...');
            captureImage();
        }
    }, [captureCountdown]);

    // Start face detection when camera is active and models are loaded
    useEffect(() => {
        if (isCameraActive && modelsLoaded && videoRef.current) {
            console.log('🎯 Starting face detection loop...');
            detectFace();
        }
    }, [isCameraActive, modelsLoaded]);

    const loadModels = async () => {
        try {
            console.log('Loading face detection models...');
            
            // Try to load models with a timeout
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
            
            console.log(`🔗 Loading models from: ${MODEL_URL}`);
            
            const modelLoadPromise = Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
            ]);
            
            // 8 second timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Models took too long to load')), 8000)
            );
            
            await Promise.race([modelLoadPromise, timeoutPromise]);
            
            console.log('✅ Face detection models loaded successfully');
            console.log('📦 Available models:', {
                tinyFaceDetector: faceapi.nets.tinyFaceDetector,
                faceLandmark68: faceapi.nets.faceLandmark68TinyNet
            });
            setModelsLoaded(true);
        } catch (err) {
            console.warn('⚠️ Face detection models not available:', err.message);
            setModelsLoaded(false);
            setError(null); // Clear error - we'll work without face detection
        } finally {
            // Always start camera, with or without models
            startCamera();
        }
    };

    const startCamera = async () => {
        try {
            console.log('📷 Starting camera...');
            setIsLoading(true);
            setError(null);
            setIsCameraActive(true); // Set this FIRST so video element renders
            goodPositionFramesRef.current = 0; // Reset frame counter
            capturedRef.current = false; // Reset capture flag
            setCaptureCountdown(null); // Reset countdown
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            console.log('✅ Stream received:', stream);
            console.log('📹 Video tracks:', stream.getVideoTracks());
            
            // Wait a tick to ensure video element is rendered
            await new Promise(resolve => setTimeout(resolve, 0));
            
            if (videoRef.current) {
                console.log('📌 Video element found');
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                console.log('📹 Stream assigned to video element');
                
                // Try multiple events to detect when video is ready
                const handleReady = () => {
                    console.log('✅ Video is ready!', {
                        videoWidth: videoRef.current.videoWidth,
                        videoHeight: videoRef.current.videoHeight,
                        readyState: videoRef.current.readyState
                    });
                    setIsLoading(false);
                    if (modelsLoaded) {
                        console.log('🔍 Starting face detection');
                        detectFace();
                    }
                };
                
                videoRef.current.onloadedmetadata = () => {
                    console.log('🎬 onloadedmetadata fired');
                    handleReady();
                };
                videoRef.current.onplay = () => {
                    console.log('▶️ onplay fired');
                    handleReady();
                };
                videoRef.current.oncanplay = () => {
                    console.log('🎥 oncanplay fired');
                    handleReady();
                };
                
                // Force play with error handling
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => console.log('▶️ Video play() succeeded'))
                        .catch(err => {
                            console.warn('⚠️ Video play() failed:', err);
                            // Still mark as ready even if play fails
                            setIsLoading(false);
                        });
                }
            } else {
                console.error('❌ Video element not found!');
                setError('Video element failed to initialize');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('❌ Camera error:', err);
            setError(`Camera error: ${err.message}`);
            setIsLoading(false);
            setIsCameraActive(false);
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
        if (!videoRef.current || !isCameraActive) return;
        
        try {
            if (modelsLoaded && videoRef.current.videoWidth > 0) {
                console.log('🔍 Attempting face detection...');
                
                const detections = await faceapi
                    .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks(true);

                console.log(`📊 Detection results: ${detections.length} face(s) detected`);

                if (detections.length > 0) {
                    console.log('✅ Raw detection data:', {
                        detection: detections[0].detection.box,
                        confidence: detections[0].detection.score
                    });

                    const resizedDetections = faceapi.resizeResults(detections, {
                        width: videoRef.current.videoWidth,
                        height: videoRef.current.videoHeight
                    });
                    
                    const detection = resizedDetections[0];
                    const landmarks = detection.landmarks;
                    
                    console.log('📍 Landmarks detected:', {
                        landmarkCount: landmarks.positions.length,
                        firstLandmark: landmarks.positions[0]
                    });

                    const isFacingForward = checkFacingForward(landmarks);
                    console.log('🔀 Facing forward check:', isFacingForward);

                    const isCentered = checkFacePosition(detection, landmarks, videoRef.current.videoWidth, videoRef.current.videoHeight);
                    console.log('📌 Centering check:', isCentered);
                    
                    // Face detected if frontal AND centered
                    const isGoodCapture = isFacingForward && isCentered;
                    console.log('🎯 Final capture status:', { isFacingForward, isCentered, isGoodCapture });
                    setFaceDetected(isGoodCapture);

                    // Track consecutive good frames for auto-capture with countdown
                    if (isGoodCapture) {
                        goodPositionFramesRef.current += 1;
                        
                        // Start countdown after 10 frames of good position
                        if (goodPositionFramesRef.current === 10 && captureCountdown === null) {
                            console.log('🎯 Face in position - starting countdown...');
                            setCaptureCountdown(3);
                        }
                        
                        console.log(`✨ Good position frame: ${goodPositionFramesRef.current}`);
                    } else {
                        goodPositionFramesRef.current = 0; // Reset counter if position is not good
                        if (captureCountdown !== null) {
                            console.log('⚠️ Face moved - countdown cancelled');
                            setCaptureCountdown(null);
                        }
                    }

                    // Draw box on canvas
                    if (canvasRef.current) {
                        faceapi.matchDimensions(canvasRef.current, {
                            width: videoRef.current.videoWidth,
                            height: videoRef.current.videoHeight
                        });
                        const ctx = canvasRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        
                        const box = detection.detection.box;
                        // Green if good, yellow if needs adjustment, red if bad angle
                        if (isGoodCapture) {
                            ctx.strokeStyle = '#10b981'; // Green - ready to capture
                            ctx.lineWidth = 4;
                        } else if (isFacingForward) {
                            ctx.strokeStyle = '#eab308'; // Yellow - face needs centering
                            ctx.lineWidth = 3;
                        } else {
                            ctx.strokeStyle = '#ef4444'; // Red - needs to face forward
                            ctx.lineWidth = 3;
                        }
                        ctx.strokeRect(box.x, box.y, box.width, box.height);
                    }
                } else {
                    console.log('❌ No faces detected in current frame');
                    setFaceDetected(false);
                    if (canvasRef.current) {
                        canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    }
                }
            } else {
                console.log('⏳ Waiting for models or video:', { modelsLoaded, videoWidth: videoRef.current?.videoWidth });
            }
        } catch (err) {
            console.error('❌ Face detection error:', err);
        }

        // Continue detection loop
        if (isCameraActive) {
            requestAnimationFrame(detectFace);
        }
    };

    const checkFacePosition = (detection, landmarks, videoWidth, videoHeight) => {
        // Check if NOSE is centered horizontally and face is positioned well vertically
        const box = detection.detection.box;
        const faceCenterY = box.y + box.height / 2;
        
        // Get nose position from landmarks
        const nose = landmarks.getNose();
        const noseMidX = nose[3].x; // Nose tip
        
        // Frame center
        const frameCenterX = videoWidth / 2;
        const frameCenterY = videoHeight / 2;
        
        // Check horizontal alignment: nose should be on the center vertical line
        const noseHorizontalDiff = Math.abs(noseMidX - frameCenterX);
        const maxNoseHorizontalDiff = videoWidth * 0.08; // LOOSE: 8% tolerance
        
        // Check vertical positioning: face can tolerate vertical deviation
        const verticalDiff = Math.abs(faceCenterY - frameCenterY);
        const maxVerticalDiff = videoHeight * 0.20; // Lenient: 20% tolerance
        
        const isNoseHorizontallyAligned = noseHorizontalDiff < maxNoseHorizontalDiff;
        const isVerticallyAcceptable = verticalDiff < maxVerticalDiff;
        const isCentered = isNoseHorizontallyAligned && isVerticallyAcceptable;
        
        console.log('📐 Position check:', {
            noseX: noseMidX.toFixed(0),
            frameCenterX: frameCenterX.toFixed(0),
            noseHorizontalDiff: noseHorizontalDiff.toFixed(0),
            maxNoseHorizontalDiff: maxNoseHorizontalDiff.toFixed(0),
            isNoseHorizontallyAligned,
            verticalDiff: verticalDiff.toFixed(0),
            maxVerticalDiff: maxVerticalDiff.toFixed(0),
            isVerticallyAcceptable,
            isCentered
        });
        
        return isCentered;
    };

    const checkFacingForward = (landmarks) => {
        try {
            const nose = landmarks.getNose();
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();

            console.log('👃 Nose points:', nose.length, '| 👁️ Eyes:', leftEye.length, leftEye.length);

            const noseMidX = nose[3].x;
            const leftEyeX = leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length;
            const rightEyeX = rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length;
            const eyesMidX = (leftEyeX + rightEyeX) / 2;

            const symmetry = Math.abs(noseMidX - eyesMidX);
            const faceWidth = Math.abs(rightEyeX - leftEyeX);
            const threshold = faceWidth * 0.35;
            
            const isFrontal = symmetry < threshold;
            
            console.log('🔀 Facing check:', {
                noseMidX: noseMidX.toFixed(1),
                eyesMidX: eyesMidX.toFixed(1),
                symmetry: symmetry.toFixed(1),
                threshold: threshold.toFixed(1),
                isFrontal
            });
            
            return isFrontal;
        } catch (err) {
            console.error('❌ Error checking facing forward:', err);
            return false;
        }
    };

    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setPreviewImage(imageData);
        setConfirmTimer(5);
        stopCamera();
    };

    const confirmCapture = () => {
        onCapture(previewImage);
        setPreviewImage(null);
        setConfirmTimer(null);
        setIsLoading(true);
    };

    const retakePhoto = () => {
        setPreviewImage(null);
        setConfirmTimer(null);
        startCamera();
    };

    const handleClose = () => {
        stopCamera();
        setPreviewImage(null);
        setConfirmTimer(null);
        setIsLoading(true);
        setIsCameraActive(false);
        onClose();
    };

    // Debug: Check video element status every 1 second
    useEffect(() => {
        if (videoRef.current && isCameraActive) {
            const interval = setInterval(() => {
                const video = videoRef.current;
                console.log('📊 Video status:', {
                    srcObject: !!video.srcObject,
                    paused: video.paused,
                    readyState: video.readyState, // 0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA
                    networkState: video.networkState, // 0=NETWORK_EMPTY, 1=NETWORK_IDLE, 2=NETWORK_LOADING, 3=NETWORK_NO_SOURCE
                    videoWidth: video.videoWidth,
                    videoHeight: video.videoHeight,
                    currentTime: video.currentTime,
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isCameraActive]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">Capture Your Photo</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {previewImage ? (
                        <>
                            <div className="relative w-full">
                                <img 
                                    src={previewImage} 
                                    alt="Preview" 
                                    className="rounded-lg shadow-lg w-full"
                                />
                                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold">
                                    Preview
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-center space-x-2">
                                <svg className="w-6 h-6 text-blue-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                </svg>
                                <span className="text-lg font-semibold text-gray-700">
                                    Auto-confirming in {confirmTimer}s
                                </span>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={retakePhoto}
                                    className="flex-1 px-4 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-all duration-200"
                                >
                                    Retake
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmCapture}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200"
                                >
                                    Confirm
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {isLoading && (
                                <div className="text-center text-gray-600 py-8">
                                    <div className="mb-4">Loading camera...</div>
                                    <p className="text-sm text-gray-500">Please allow a moment for initialization</p>
                                </div>
                            )}
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                    {error}
                                </div>
                            )}
                            
                            {isCameraActive && (
                                <>
                                    <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '360px' }}>
                                        {/* Center guide - crosshair */}
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                                            {/* Vertical center line */}
                                            <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" strokeDasharray="5,5" />
                                            {/* Horizontal center line */}
                                            <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" strokeDasharray="5,5" />
                                            {/* Center circle guide */}
                                            <circle cx="50%" cy="50%" r="15%" fill="none" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" strokeDasharray="5,5" />
                                        </svg>

                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            controls={false}
                                            width="640"
                                            height="480"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                backgroundColor: '#000',
                                                display: 'block'
                                            }}
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            className="absolute top-0 left-0 w-full h-full"
                                            style={{
                                                width: '100%',
                                                height: '100%'
                                            }}
                                        />
                                    </div>

                                    {isLoading && (
                                        <div className="text-center text-white mt-4 text-sm">
                                            <p>Initializing video stream...</p>
                                            <p className="text-xs mt-2">Check browser console for details</p>
                                        </div>
                                    )}

                                    {!isLoading && modelsLoaded && (
                                        <>
                                            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg mt-4 ${
                                                faceDetected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    {faceDetected ? (
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    ) : (
                                                        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
                                                    )}
                                                </svg>
                                                <span className="text-sm font-medium">
                                                    {faceDetected ? 'Face properly positioned ✓ Ready to capture!' : 'Position face: center + facing forward'}
                                                </span>
                                            </div>

                                            {captureCountdown !== null && (
                                                <div className="flex items-center justify-center px-4 py-3 rounded-lg mt-4 bg-blue-500 text-white">
                                                    <svg className="w-6 h-6 mr-2 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 1119.414 5.414 1 1 0 01-1.414-1.414A5.002 5.002 0 005.659 4.1V3a1 1 0 011-1zm7.464 4.536a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L10 8.414l2.121 2.121a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-lg font-bold">Capturing in {captureCountdown}...</span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {!isLoading && !modelsLoaded && (
                                        <div className="flex items-center space-x-2 px-4 py-2 rounded-lg mt-4 bg-blue-100 text-blue-700">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm font-medium">Face detection unavailable - camera ready</span>
                                        </div>
                                    )}

                                    <div className="flex space-x-3 mt-4">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={captureImage}
                                            disabled={!faceDetected}
                                            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                                                faceDetected 
                                                    ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer' 
                                                    : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                                            }`}
                                        >
                                            {faceDetected ? '✓ Capture Photo' : 'Position Face to Capture'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraModal;
