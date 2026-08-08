"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface University {
    name: string;
    domains: string[];
    web_pages: string[];
    country: string;
    alpha_two_code: string;
    "state-province": string | null;
}

interface UniversitySearchProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    /** Extra Tailwind classes for the outer wrapper */
    className?: string;
    /** Visual variant: 'dark' forces dark styling (for CompleteProfileGate) */
    variant?: 'default' | 'dark';
}

const API_URL = 'https://university-domains-list-api-tn4l.onrender.com/search?country=Nigeria';

export default function UniversitySearch({
    value,
    onChange,
    required = false,
    className = '',
    variant = 'default',
}: UniversitySearchProps) {
    const [universities, setUniversities] = useState<University[]>([]);
    const [query, setQuery] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [loadingUnis, setLoadingUnis] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Fetch universities once on mount.
    useEffect(() => {
        setLoadingUnis(true);
        fetch(API_URL)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setUniversities(data);
            })
            .catch(() => {})
            .finally(() => setLoadingUnis(false));
    }, []);

    // Sync external value changes to internal query.
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Close dropdown on outside click.
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                // If user typed something that isn't an exact match, revert to last valid value
                if (query !== value) setQuery(value);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [query, value]);

    // Filter universities by query.
    const filtered = query.trim()
        ? universities.filter((u) =>
              u.name.toLowerCase().includes(query.toLowerCase())
          )
        : universities;

    const visibleResults = filtered.slice(0, 50);

    function selectUniversity(name: string) {
        setQuery(name);
        onChange(name);
        setIsOpen(false);
        setHighlightedIndex(-1);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
            e.preventDefault();
            setIsOpen(true);
            return;
        }
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < visibleResults.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : visibleResults.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && visibleResults[highlightedIndex]) {
                    selectUniversity(visibleResults[highlightedIndex].name);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                if (query !== value) setQuery(value);
                break;
        }
    }

    // Scroll highlighted item into view.
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const item = listRef.current.children[highlightedIndex] as HTMLElement;
            item?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex]);

    const isDark = variant === 'dark';

    const inputClasses = isDark
        ? 'w-full pl-9 pr-8 py-3 border border-zinc-700 rounded-lg text-sm text-white bg-zinc-800 placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-all duration-300'
        : 'w-full pl-9 pr-8 py-3 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-zinc-800 dark:placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10';

    const dropdownClasses = isDark
        ? 'absolute z-50 left-0 right-0 mt-1 max-h-[220px] overflow-y-auto bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl'
        : 'absolute z-50 left-0 right-0 mt-1 max-h-[220px] overflow-y-auto bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl';

    const itemBase = isDark
        ? 'px-3.5 py-2.5 text-sm cursor-pointer transition-colors text-gray-300'
        : 'px-3.5 py-2.5 text-sm cursor-pointer transition-colors text-gray-700 dark:text-gray-300';

    const itemHighlight = isDark
        ? 'bg-zinc-700 text-white'
        : 'bg-blue-50 dark:bg-zinc-700 text-gray-900 dark:text-white';

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {/* Hidden native input for form validation when required */}
            {required && (
                <input
                    type="text"
                    value={value}
                    required
                    tabIndex={-1}
                    aria-hidden="true"
                    className="absolute inset-0 opacity-0 pointer-events-none"
                    onChange={() => {}}
                />
            )}

            <div className="relative">
                <Search
                    size={16}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                        isDark ? 'text-gray-500' : 'text-gray-400 dark:text-gray-500'
                    }`}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        setHighlightedIndex(-1);
                        // Clear the selected value when user starts typing a new query
                        if (value && e.target.value !== value) {
                            onChange('');
                        }
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={loadingUnis ? 'Loading universities…' : 'Search university…'}
                    className={inputClasses}
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-autocomplete="list"
                    aria-controls="university-listbox"
                    autoComplete="off"
                />
                {value ? (
                    <button
                        type="button"
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors ${
                            isDark
                                ? 'text-gray-500 hover:text-white hover:bg-zinc-600'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700'
                        }`}
                        onClick={() => {
                            setQuery('');
                            onChange('');
                            inputRef.current?.focus();
                            setIsOpen(true);
                        }}
                        aria-label="Clear selection"
                    >
                        <X size={14} />
                    </button>
                ) : (
                    <ChevronDown
                        size={16}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                        } ${isDark ? 'text-gray-500' : 'text-gray-400 dark:text-gray-500'}`}
                    />
                )}
            </div>

            {isOpen && (
                <ul
                    ref={listRef}
                    id="university-listbox"
                    role="listbox"
                    className={dropdownClasses}
                >
                    {visibleResults.length === 0 ? (
                        <li className={`${itemBase} italic opacity-60 cursor-default`}>
                            {loadingUnis ? 'Loading…' : 'No universities found'}
                        </li>
                    ) : (
                        visibleResults.map((uni, idx) => (
                            <li
                                key={uni.name}
                                role="option"
                                aria-selected={uni.name === value}
                                className={`${itemBase} ${
                                    idx === highlightedIndex ? itemHighlight : ''
                                } ${uni.name === value ? 'font-semibold' : ''}`}
                                onClick={() => selectUniversity(uni.name)}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                            >
                                {uni.name}
                            </li>
                        ))
                    )}
                    {filtered.length > 50 && (
                        <li className={`${itemBase} text-xs opacity-50 cursor-default text-center`}>
                            Type to narrow down {filtered.length - 50} more results…
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
