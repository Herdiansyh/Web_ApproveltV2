import React, { useState, useEffect } from 'react';

const LogoutAnimation = ({ show }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!show) {
            setProgress(0);
            return;
        }

        // Simulate progress that adapts to actual loading time
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev < 30) return prev + 2; // Quick start
                if (prev < 70) return prev + 1; // Steady progress
                if (prev < 90) return prev + 0.5; // Slow down near completion
                return prev; // Cap at 90% until actual completion
            });
        }, 50);

        return () => clearInterval(interval);
    }, [show]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-6 min-w-[320px]">
                {/* Animated Icon */}
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5m-3 6h-3" />
                        </svg>
                    </div>
                </div>

                {/* Loading Text */}
                <div className="text-center space-y-2">
                    <p className="text-lg font-semibold text-gray-800">Sedang Logout...</p>
                    <p className="text-sm text-gray-500">Mohon tunggu sebentar</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(progress, 90)}%` }}
                    ></div>
                </div>

                {/* Progress Percentage */}
                <div className="text-xs text-gray-500 font-medium">
                    {Math.round(Math.min(progress, 90))}%
                </div>

                {/* Progress Dots */}
                <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
};

export default LogoutAnimation;
