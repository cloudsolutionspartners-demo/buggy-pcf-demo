import React, { useState, useCallback, useRef } from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    debounceMs?: number;
    placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    onSearch,
    debounceMs = 300,
    placeholder = 'Search contacts…',
}) => {
    const [value, setValue] = useState('');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const q = e.target.value;
            setValue(q);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => onSearch(q), debounceMs);
        },
        [onSearch, debounceMs]
    );

    return (
        <input
            type="search"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            data-testid="search-bar"
            aria-label="Search contacts"
        />
    );
};
