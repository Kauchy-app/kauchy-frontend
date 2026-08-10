import React, { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    disabled?: boolean;
}

export default function OTPInput({ length = 6, value, onChange, onComplete, disabled = false }: OTPInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        if (!/^[0-9]*$/.test(val)) return; // only numbers

        const otpArray = value.split('');
        otpArray[index] = val.substring(val.length - 1); // take the last character typed
        const newOtp = otpArray.join('');
        onChange(newOtp);

        if (newOtp.length === length && onComplete) {
            onComplete(newOtp);
        }

        // move to next input if there is a value
        if (val && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            // move to previous input on backspace if current is empty
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
        if (pastedData) {
            onChange(pastedData);
            
            if (pastedData.length === length && onComplete) {
                onComplete(pastedData);
            }

            // Focus the next empty input, or the last one if full
            const nextIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    return (
        <div className="flex justify-center gap-2 sm:gap-3 my-4">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-transparent border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-400 dark:hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
            ))}
        </div>
    );
}
