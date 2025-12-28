import { useEffect, useRef, useState } from 'react';

const SimpleCameraTest = () => {
    const videoRef = useRef(null);
    const [status, setStatus] = useState('Initializing...');
    const streamRef = useRef(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                console.log('🎬 SimpleCameraTest: Starting camera');
                setStatus('Requesting camera access...');
                
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                    }
                });

                console.log('✅ SimpleCameraTest: Stream received', stream);
                setStatus('Stream received, setting video element...');

                if (videoRef.current) {
                    console.log('📌 SimpleCameraTest: Video element found');
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;

                    // Log video element info
                    console.log('📊 Video element:', {
                        tagName: videoRef.current.tagName,
                        hasStream: !!videoRef.current.srcObject,
                    });

                    // Try to play
                    videoRef.current.play()
                        .then(() => {
                            console.log('▶️ SimpleCameraTest: Video playing');
                            setStatus('✅ Camera is working!');
                        })
                        .catch(err => {
                            console.error('❌ SimpleCameraTest: Play failed', err);
                            setStatus(`Play error: ${err.message}`);
                        });
                }
            } catch (err) {
                console.error('❌ SimpleCameraTest: Error', err);
                setStatus(`Error: ${err.message}`);
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <h1 className="text-2xl font-bold">Simple Camera Test</h1>
            <p className="text-sm">{status}</p>
            
            <div className="relative w-full max-w-md bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '300px' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        backgroundColor: '#000'
                    }}
                />
            </div>
            <p className="text-xs text-gray-500">Open browser console (F12) to see logs</p>
        </div>
    );
};

export default SimpleCameraTest;
