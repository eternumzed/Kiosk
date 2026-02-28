import { useState } from 'react';

const VirtualKeyboard = ({ onKeyPress, onBackspace, onEnter, onClose, visible }) => {
    const [isShift, setIsShift] = useState(false);
    const [isSymbol, setIsSymbol] = useState(false);

    if (!visible) return null;

    // Keyboard layouts
    const letterRows = [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    ];

    const numberRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

    const symbolRows = [
        ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
        ['-', '_', '=', '+', '[', ']', '{', '}', '|', '\\'],
        [';', ':', "'", '"', ',', '.', '<', '>', '/', '?'],
    ];

    const handleKeyPress = (key) => {
        const outputKey = isShift ? key.toUpperCase() : key;
        onKeyPress(outputKey);
        if (isShift) setIsShift(false);
    };

    const handleSymbolPress = (symbol) => {
        onKeyPress(symbol);
    };

    const toggleShift = () => {
        setIsShift(!isShift);
    };

    const toggleSymbol = () => {
        setIsSymbol(!isSymbol);
        setIsShift(false);
    };

    const KeyButton = ({ children, onClick, className = '', wide = false, extraWide = false }) => (
        <button
            type="button"
            onClick={onClick}
            className={`
                ${extraWide ? 'min-w-[120px] flex-grow' : wide ? 'min-w-[80px]' : 'min-w-[48px]'}
                h-14 px-3 m-1
                bg-white border border-gray-200 rounded-lg
                text-xl font-semibold text-gray-800
                hover:bg-emerald-50 hover:border-emerald-400
                active:bg-emerald-100 active:scale-95
                transition-all duration-100
                ${className}
            `}
        >
            {children}
        </button>
    );

    const renderLetterKeyboard = () => (
        <>
            {/* Number Row */}
            <div className="flex justify-center">
                {numberRow.map((key) => (
                    <KeyButton key={key} onClick={() => handleKeyPress(key)}>
                        {key}
                    </KeyButton>
                ))}
            </div>

            {/* Letter Rows */}
            {letterRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center">
                    {rowIndex === 2 && (
                        <KeyButton
                            onClick={toggleShift}
                            wide
                            className={isShift ? 'bg-emerald-100 border-emerald-500' : ''}
                        >
                            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                        </KeyButton>
                    )}
                    {row.map((key) => (
                        <KeyButton key={key} onClick={() => handleKeyPress(key)}>
                            {isShift ? key.toUpperCase() : key}
                        </KeyButton>
                    ))}
                    {rowIndex === 2 && (
                        <KeyButton onClick={onBackspace} wide>
                            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                            </svg>
                        </KeyButton>
                    )}
                </div>
            ))}
        </>
    );

    const renderSymbolKeyboard = () => (
        <>
            {symbolRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center">
                    {row.map((key) => (
                        <KeyButton key={key} onClick={() => handleSymbolPress(key)}>
                            {key}
                        </KeyButton>
                    ))}
                </div>
            ))}
            <div className="flex justify-center">
                <KeyButton onClick={onBackspace} wide>
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                    </svg>
                </KeyButton>
            </div>
        </>
    );

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t-2 border-gray-300 shadow-2xl z-50 p-4">
            {/* Close button */}
            <div className="flex justify-end mb-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-semibold transition-colors"
                >
                    <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Hide Keyboard
                </button>
            </div>

            {/* Keyboard Layout */}
            <div className="max-w-4xl mx-auto">
                {isSymbol ? renderSymbolKeyboard() : renderLetterKeyboard()}

                {/* Bottom Row */}
                <div className="flex justify-center items-center">
                    <KeyButton onClick={toggleSymbol} wide className={isSymbol ? 'bg-emerald-100 border-emerald-500' : ''}>
                        {isSymbol ? 'ABC' : '?123'}
                    </KeyButton>
                    <KeyButton onClick={() => onKeyPress('@')}>
                        @
                    </KeyButton>
                    <KeyButton onClick={() => onKeyPress(' ')} extraWide>
                        Space
                    </KeyButton>
                    <KeyButton onClick={() => onKeyPress('.')}>
                        .
                    </KeyButton>
                    <KeyButton
                        onClick={onEnter}
                        wide
                        className="bg-emerald-600 text-black border-emerald-700 hover:bg-emerald-700 hover:border-emerald-800"
                    >
                        Done
                    </KeyButton>
                </div>
            </div>
        </div>
    );
};

export default VirtualKeyboard;
