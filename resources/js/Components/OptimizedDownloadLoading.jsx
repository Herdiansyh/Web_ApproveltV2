import React, { useEffect, useState } from 'react';

const OptimizedDownloadLoading = ({ show = false, onComplete = null, realProgress = null }) => {
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (show) {
            setProgress(0);
            setIsComplete(false);
            
            if (realProgress !== null) {
                setProgress(realProgress);
                if (realProgress >= 100) {
                    setIsComplete(true);
                    setTimeout(() => {
                        if (onComplete) onComplete();
                    }, 500);
                }
                return;
            }
            
            const interval = setInterval(() => {
                setProgress(prev => {
                    const newProgress = prev + 2;
                    if (newProgress >= 100) {
                        clearInterval(interval);
                        setIsComplete(true);
                        setTimeout(() => {
                            if (onComplete) onComplete();
                        }, 500);
                        return 100;
                    }
                    return newProgress;
                });
            }, 200);

            return () => clearInterval(interval);
        }
    }, [show, onComplete, realProgress]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-6 min-w-[320px]">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {isComplete ? (
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8 text-green-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        )}
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <p className="text-lg font-semibold text-gray-800">
                        {isComplete ? 'Download Selesai!' : 'Mengunduh dokumen...'}
                    </p>
                    <p className="text-sm text-gray-500">
                        {isComplete ? 'Dokumen berhasil diunduh' : `${Math.round(progress)}% selesai`}
                    </p>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-2 rounded-full transition-all duration-300 ease-out ${
                            isComplete ? 'bg-green-600' : 'bg-green-500'
                        }`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className="text-xs text-gray-500 font-medium">
                    {Math.round(progress)}%
                </div>
            </div>
        </div>
    );
};

export default OptimizedDownloadLoading;
