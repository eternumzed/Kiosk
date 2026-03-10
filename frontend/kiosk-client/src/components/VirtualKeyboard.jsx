import { useState, useRef } from 'react';

const VirtualKeyboard = ({ onKeyPress, onBackspace, onEnter, onClose, visible }) => {
    const [isShift, setIsShift] = useState(false);
    const [isCapsLock, setIsCapsLock] = useState(false);
    const [isSymbol, setIsSymbol] = useState(false);
    const [pressedKey, setPressedKey] = useState(null);
    const lastShiftTap = useRef(0);
    const lastPressTime = useRef(0);
    const backspaceDelayTimeoutRef = useRef(null);
    const backspaceRepeatIntervalRef = useRef(null);

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
        const outputKey = (isShift || isCapsLock) ? key.toUpperCase() : key;
        onKeyPress(outputKey);
        // Only reset shift if not in caps lock mode
        if (isShift && !isCapsLock) setIsShift(false);
    };

    const handleSymbolPress = (symbol) => {
        onKeyPress(symbol);
    };

    const toggleShift = (tapTime) => {
        const timeSinceLastTap = tapTime - lastShiftTap.current;
        
        // Debounce: ignore taps within 100ms (prevents accidental double-fires on touch)
        if (timeSinceLastTap < 100) {
            return;
        }
        
        if (timeSinceLastTap < 400 && !isCapsLock && isShift) {
            // Double-tap detected (shift is already on) - enable caps lock
            setIsCapsLock(true);
            setIsShift(true);
        } else if (isCapsLock) {
            // Caps lock is on - turn it off
            setIsCapsLock(false);
            setIsShift(false);
        } else {
            // Single tap - toggle shift
            setIsShift(!isShift);
        }
        
        lastShiftTap.current = tapTime;
    };

    const toggleSymbol = () => {
        setIsSymbol(!isSymbol);
        setIsShift(false);
        setIsCapsLock(false);
    };

    // Touch feedback - haptic vibration if supported
    const triggerHapticFeedback = () => {
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    };

    const handleButtonPress = (e, keyId, callback) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Debounce - prevent double firing from touch + mouse events
        const now = Date.now();
        if (now - lastPressTime.current < 150) {
            return;
        }
        lastPressTime.current = now;
        
        const tapTime = now;
        setPressedKey(keyId);
        triggerHapticFeedback();
        
        // Delay callback to show visual feedback first
        setTimeout(() => {
            // Pass tap time if it's the shift key
            if (keyId === 'shift') {
                callback(tapTime);
            } else {
                callback();
            }
            setPressedKey(null);
        }, 80);
    };

    const clearBackspaceRepeat = () => {
        if (backspaceDelayTimeoutRef.current) {
            clearTimeout(backspaceDelayTimeoutRef.current);
            backspaceDelayTimeoutRef.current = null;
        }
        if (backspaceRepeatIntervalRef.current) {
            clearInterval(backspaceRepeatIntervalRef.current);
            backspaceRepeatIntervalRef.current = null;
        }
        if (pressedKey === 'backspace' || pressedKey === 'backspace-sym') {
            setPressedKey(null);
        }
    };

    const startBackspaceRepeat = (e, keyId) => {
        e.preventDefault();
        e.stopPropagation();

        setPressedKey(keyId);
        triggerHapticFeedback();
        onBackspace();

        backspaceDelayTimeoutRef.current = setTimeout(() => {
            backspaceRepeatIntervalRef.current = setInterval(() => {
                onBackspace();
            }, 65);
        }, 350);
    };

    const KeyButton = ({ children, onClick, keyId, className = '', wide = false, extraWide = false }) => {
        const isPressed = pressedKey === keyId;
        return (
            <button
                type="button"
                onTouchStart={(e) => handleButtonPress(e, keyId, onClick)}
                onMouseDown={(e) => handleButtonPress(e, keyId, onClick)}
                className={`
                    ${extraWide ? 'min-w-[200px] flex-grow' : wide ? 'min-w-[104px]' : 'min-w-[68px]'}
                    h-14 px-3 m-0.5
                    border-2 rounded-xl
                    text-xl font-semibold
                    select-none touch-manipulation
                    ${isPressed 
                        ? 'bg-emerald-300 border-emerald-600 scale-90 shadow-inner text-gray-900' 
                        : 'bg-white border-gray-200 text-gray-800 shadow-sm'}
                    ${className}
                `}
                style={{ transition: 'transform 0.05s, background-color 0.05s' }}
            >
                {children}
            </button>
        );
    };

    const renderLetterKeyboard = () => (
        <>
            {/* Number Row with Hide Keyboard */}
            <div className="flex justify-center items-center">
                {numberRow.map((key) => (
                    <KeyButton key={key} keyId={`num-${key}`} onClick={() => handleKeyPress(key)}>
                        {key}
                    </KeyButton>
                ))}
                <button
                    type="button"
                    onTouchStart={(e) => handleButtonPress(e, 'hide-letter', onClose)}
                    onMouseDown={(e) => handleButtonPress(e, 'hide-letter', onClose)}
                    className={`min-w-[104px] h-14 px-3 m-0.5 border-2 rounded-xl text-sm font-semibold flex items-center justify-center select-none touch-manipulation ${pressedKey === 'hide-letter' ? 'bg-gray-400 border-gray-500 scale-90 shadow-inner' : 'bg-gray-200 border-gray-300 text-gray-700'}`}
                    style={{ transition: 'transform 0.05s, background-color 0.05s' }}
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Hide
                </button>
            </div>

            {/* Letter Rows */}
            {letterRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center">
                    {rowIndex === 2 && (
                        <KeyButton
                            keyId="shift"
                            onClick={toggleShift}
                            wide
                            className={isCapsLock ? 'bg-emerald-400 border-emerald-600' : isShift ? 'bg-emerald-100 border-emerald-500' : ''}
                        >
                            {isCapsLock ? (
                                <svg className="w-8 h-8 mx-auto text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 4l-8 8h5v8h6v-8h5l-8-8z" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 mx-auto text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                            )}
                        </KeyButton>
                    )}
                    {row.map((key) => (
                        <KeyButton key={key} keyId={`letter-${key}`} onClick={() => handleKeyPress(key)}>
                            {(isShift || isCapsLock) ? key.toUpperCase() : key}
                        </KeyButton>
                    ))}
                    {rowIndex === 2 && (
                        <button
                            type="button"
                            onPointerDown={(e) => startBackspaceRepeat(e, 'backspace')}
                            onPointerUp={clearBackspaceRepeat}
                            onPointerLeave={clearBackspaceRepeat}
                            onPointerCancel={clearBackspaceRepeat}
                            className={`
                                min-w-[104px] h-14 px-3 m-0.5
                                border-2 rounded-xl text-lg font-semibold
                                select-none touch-manipulation
                                ${pressedKey === 'backspace'
                                    ? 'bg-emerald-300 border-emerald-600 scale-90 shadow-inner text-gray-900'
                                    : 'bg-white border-gray-200 text-gray-800 shadow-sm'}
                            `}
                            style={{ transition: 'transform 0.05s, background-color 0.05s' }}
                        >
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                            </svg>
                        </button>
                    )}
                </div>
            ))}
        </>
    );

    const renderSymbolKeyboard = () => (
        <>
            {/* First symbol row with Hide button */}
            <div className="flex justify-center items-center">
                {symbolRows[0].map((key) => (
                    <KeyButton key={key} keyId={`sym-${key}`} onClick={() => handleSymbolPress(key)}>
                        {key}
                    </KeyButton>
                ))}
                <button
                    type="button"
                    onTouchStart={(e) => handleButtonPress(e, 'hide-symbol', onClose)}
                    onMouseDown={(e) => handleButtonPress(e, 'hide-symbol', onClose)}
                    className={`min-w-[104px] h-14 px-3 m-0.5 border-2 rounded-xl text-sm font-semibold flex items-center justify-center select-none touch-manipulation ${pressedKey === 'hide-symbol' ? 'bg-gray-400 border-gray-500 scale-90 shadow-inner' : 'bg-gray-200 border-gray-300 text-gray-700'}`}
                    style={{ transition: 'transform 0.05s, background-color 0.05s' }}
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Hide
                </button>
            </div>
            {/* Remaining symbol rows */}
            {symbolRows.slice(1).map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center">
                    {row.map((key) => (
                        <KeyButton key={key} keyId={`sym-${key}`} onClick={() => handleSymbolPress(key)}>
                            {key}
                        </KeyButton>
                    ))}
                </div>
            ))}
            <div className="flex justify-center">
                <button
                    type="button"
                    onPointerDown={(e) => startBackspaceRepeat(e, 'backspace-sym')}
                    onPointerUp={clearBackspaceRepeat}
                    onPointerLeave={clearBackspaceRepeat}
                    onPointerCancel={clearBackspaceRepeat}
                    className={`
                        min-w-[104px] h-14 px-3 m-0.5
                        border-2 rounded-xl text-lg font-semibold
                        select-none touch-manipulation
                        ${pressedKey === 'backspace-sym'
                            ? 'bg-emerald-300 border-emerald-600 scale-90 shadow-inner text-gray-900'
                            : 'bg-white border-gray-200 text-gray-800 shadow-sm'}
                    `}
                    style={{ transition: 'transform 0.05s, background-color 0.05s' }}
                >
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                    </svg>
                </button>
            </div>
        </>
    );

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t-2 border-gray-300 shadow-2xl z-50 p-2">
            {/* Keyboard Layout */}
            <div className="max-w-5xl mx-auto">
                {isSymbol ? renderSymbolKeyboard() : renderLetterKeyboard()}

                {/* Bottom Row */}
                <div className="flex justify-center items-center">
                    <KeyButton keyId="toggle-symbol" onClick={toggleSymbol} wide className={isSymbol ? 'bg-emerald-100 border-emerald-500' : ''}>
                        {isSymbol ? 'ABC' : '?123'}
                    </KeyButton>
                    <KeyButton keyId="at" onClick={() => onKeyPress('@')}>
                        @
                    </KeyButton>
                    <KeyButton keyId="space" onClick={() => onKeyPress(' ')} extraWide>
                        Space
                    </KeyButton>
                    <KeyButton keyId="dot" onClick={() => onKeyPress('.')}>
                        .
                    </KeyButton>
                    <KeyButton
                        keyId="done"
                        onClick={onEnter}
                        wide
                        className="bg-emerald-600 text-black border-emerald-700"
                    >
                        Done
                    </KeyButton>
                </div>
            </div>
        </div>
    );
};

export default VirtualKeyboard;
