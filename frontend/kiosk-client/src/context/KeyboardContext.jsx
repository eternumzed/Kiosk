import { createContext, useContext, useState, useCallback } from 'react';

const KeyboardContext = createContext(null);

export const useKeyboard = () => {
    const context = useContext(KeyboardContext);
    if (!context) {
        throw new Error('useKeyboard must be used within a KeyboardProvider');
    }
    return context;
};

export const KeyboardProvider = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [onChangeCallback, setOnChangeCallback] = useState(null);

    const showKeyboard = useCallback((inputRef, value, onChange) => {
        setInputValue(value || '');
        setOnChangeCallback(() => onChange);
        setIsVisible(true);
    }, []);

    const hideKeyboard = useCallback(() => {
        setIsVisible(false);
        setOnChangeCallback(null);
    }, []);

    const handleKeyPress = useCallback((key) => {
        setInputValue((prev) => {
            const newValue = prev + key;
            if (onChangeCallback) {
                onChangeCallback(newValue);
            }
            return newValue;
        });
    }, [onChangeCallback]);

    const handleBackspace = useCallback(() => {
        setInputValue((prev) => {
            if (prev.length === 0) {
                return prev;
            }
            const newValue = prev.slice(0, -1);
            if (onChangeCallback) {
                onChangeCallback(newValue);
            }
            return newValue;
        });
    }, [onChangeCallback]);

    const handleEnter = useCallback(() => {
        hideKeyboard();
    }, [hideKeyboard]);

    const updateInputValue = useCallback((value) => {
        setInputValue(value);
    }, []);

    const value = {
        isVisible,
        showKeyboard,
        hideKeyboard,
        handleKeyPress,
        handleBackspace,
        handleEnter,
        inputValue,
        updateInputValue,
    };

    return (
        <KeyboardContext.Provider value={value}>
            {children}
        </KeyboardContext.Provider>
    );
};

export default KeyboardContext;
