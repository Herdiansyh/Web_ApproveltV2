import React, { useEffect, useRef, useState } from 'react';

const OptimizedTruckLoading = ({ show = false, text = 'Processing...', success = true }) => {
    const [progress, setProgress] = useState(0);
    const startTimeRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (show) {
            startTimeRef.current = Date.now();
            setProgress(0);
            
            // Optimized: 100ms interval instead of 50ms (10x per detik vs 20x)
            intervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTimeRef.current;
                let calculatedProgress = 0;
                
                if (elapsed < 500) {
                    calculatedProgress = (elapsed / 500) * 20;
                } else if (elapsed < 2000) {
                    calculatedProgress = 20 + ((elapsed - 500) / 1500) * 60;
                } else {
                    calculatedProgress = 80 + Math.min(((elapsed - 2000) / 3000) * 15, 15);
                }
                
                setProgress(Math.min(calculatedProgress, 95));
            }, 100); // Reduced from 50ms to 100ms
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setProgress(100);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [show]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-6 min-w-[320px]">
                {/* Simple CSS-only truck animation */}
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg animate-pulse"></div>
                    </div>
                </div>

                {/* Loading Text */}
                <div className="text-center space-y-2">
                    <p className="text-lg font-semibold text-gray-800">{text}</p>
                    <p className="text-sm text-gray-500">Mohon tunggu sebentar</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Progress Percentage */}
                <div className="text-xs text-gray-500 font-medium">
                    {Math.round(progress)}%
                </div>
            </div>
        </div>
    );
};

export default OptimizedTruckLoading;
