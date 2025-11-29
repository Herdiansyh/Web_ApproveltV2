import React, { createContext, useContext, useState } from 'react';
import TruckLoading from './TruckLoading';

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

    const showLoading = (text = 'Processing...', success = true) => {
        setLoadingText(text);
        setIsSuccess(success);
        setIsLoading(true);
    };

    const hideLoading = (success = true) => {
        setIsSuccess(success);
        setIsLoading(false);
    };

    return (
        <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading, isSuccess }}>
            {children}
            <TruckLoading show={isLoading} text={loadingText} success={isSuccess} />
        </LoadingContext.Provider>
    );
};

export default LoadingProvider;
