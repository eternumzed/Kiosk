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

    // Update keyboard value when input value changes externally
    useEffect(() => {
        if (isVisible) {
            updateInputValue(value || '');
        }
    }, [value, isVisible, updateInputValue]);

    const handleFocus = () => {
        // Prevent native keyboard from showing
        if (inputRef.current) {
            inputRef.current.readOnly = true;
        }
        showKeyboard(inputRef, value, onChange);
    };

    const handleClick = () => {
        handleFocus();
    };

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            // Small delay to ensure component is mounted
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
            onClick={handleClick}
            onFocus={handleFocus}
            placeholder={placeholder}
            readOnly
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
