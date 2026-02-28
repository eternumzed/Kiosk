import { createContext, useContext, useState, useCallback, useRef } from 'react';

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
    const [activeInputRef, setActiveInputRef] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [onChangeCallback, setOnChangeCallback] = useState(null);

    const showKeyboard = useCallback((inputRef, value, onChange) => {
        setActiveInputRef(inputRef);
        setInputValue(value || '');
        setOnChangeCallback(() => onChange);
        setIsVisible(true);
    }, []);

    const hideKeyboard = useCallback(() => {
        setIsVisible(false);
        setActiveInputRef(null);
        setOnChangeCallback(null);
    }, []);

    const handleKeyPress = useCallback((key) => {
        const newValue = inputValue + key;
        setInputValue(newValue);
        if (onChangeCallback) {
            onChangeCallback(newValue);
        }
    }, [inputValue, onChangeCallback]);

    const handleBackspace = useCallback(() => {
        const newValue = inputValue.slice(0, -1);
        setInputValue(newValue);
        if (onChangeCallback) {
            onChangeCallback(newValue);
        }
    }, [inputValue, onChangeCallback]);

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
