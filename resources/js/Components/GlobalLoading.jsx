import React, { createContext, useContext, useState } from 'react';
import OptimizedTruckLoading from './OptimizedTruckLoading';
import LogoutAnimation from './LogoutAnimation';

const LoadingContext = createContext();

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};

export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Processing...');
    const [isSuccess, setIsSuccess] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const showLoading = (text = 'Processing...', success = true) => {
        setLoadingText(text);
        setIsSuccess(success);
        setIsLoading(true);
    };

    const hideLoading = (success = true) => {
        setIsSuccess(success);
        setIsLoading(false);
    };

    const showLogoutAnimation = () => {
        setIsLoggingOut(true);
    };

    const hideLogoutAnimation = () => {
        setIsLoggingOut(false);
    };

    return (
        <LoadingContext.Provider value={{ 
            showLoading, 
            hideLoading, 
            isLoading, 
            isSuccess, 
            showLogoutAnimation, 
            hideLogoutAnimation, 
            isLoggingOut 
        }}>
            {children}
            <OptimizedTruckLoading show={isLoading} text={loadingText} success={isSuccess} />
            <LogoutAnimation show={isLoggingOut} />
        </LoadingContext.Provider>
    );
};

export default LoadingProvider;
