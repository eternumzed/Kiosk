import { useRef, useEffect } from 'react';
import { useKeyboard } from '../context/KeyboardContext';

const KeyboardInput = ({ 
    value, 
    onChange, 
    placeholder, 
    type = 'text',
    className = '',
    autoFocus = false,
    ...props 
}) => {
    const inputRef = useRef(null);
    const { showKeyboard, updateInputValue, isVisible } = useKeyboard();

    // Sync keyboard with external value changes
    useEffect(() => {
        if (isVisible) {
            updateInputValue(value || '');
        }
    }, [value, isVisible, updateInputValue]);

    const handleFocus = () => {
        showKeyboard(inputRef, value, onChange);
    };

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            const timer = setTimeout(() => {
                handleFocus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [autoFocus]);

    return (
        <input
            ref={inputRef}
            type={type}
            value={value}
            readOnly
            onClick={handleFocus}
            onFocus={handleFocus}
            placeholder={placeholder}
            className={`
                w-full px-4 py-4 text-lg
                border-2 border-gray-300 rounded-xl
                bg-white cursor-text
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                transition duration-150 ease-in-out
                placeholder-gray-400
                ${className}
            `}
            {...props}
        />
    );
};

export default KeyboardInput;
