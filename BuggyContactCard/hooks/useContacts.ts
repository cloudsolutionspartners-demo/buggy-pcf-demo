import { useState, useEffect, useCallback } from 'react';
import { Contact } from '../types/Contact';
import { DataverseService } from '../services/DataverseService';

const PAGE_SIZE = 10;
const REFRESH_INTERVAL = 30000;

export interface UseContactsReturn {
    contacts: Contact[];
    allContacts: Contact[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    searchQuery: string;
    search: (query: string) => Promise<void>;
    createContact: (contact: Omit<Contact, 'contactid'>) => Promise<void>;
    updateContact: (id: string, updates: Partial<Omit<Contact, 'contactid'>>) => Promise<void>;
    deleteContact: (id: string) => Promise<void>;
    loadContacts: () => Promise<void>;
}

export function useContacts(service: DataverseService): UseContactsReturn {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadContacts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await service.getContacts();
            setContacts(data);
            setFilteredContacts(data);
        } catch {
            setError('Failed to load contacts');
        } finally {
            setLoading(false);
        }
    }, [service]);

    // BUG #10 (COMPLEX): Memory leak — setInterval is never cleared on unmount
    useEffect(() => {
        loadContacts();
        const interval = setInterval(loadContacts, REFRESH_INTERVAL);
        // BUG: missing `return () => clearInterval(interval);`
    }, [loadContacts]);

    // BUG #8 (COMPLEX): Race condition — no in-flight request cancellation.
    // If search('a') fires then search('ab') fires, and 'a' resolves last,
    // the stale results from 'a' overwrite the correct results from 'ab'.
    const search = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setFilteredContacts(contacts);
            return;
        }
        setLoading(true);
        try {
            const results = await service.searchContacts(query); // BUG: no AbortController
            setFilteredContacts(results);
        } catch {
            setError('Search failed');
        } finally {
            setLoading(false);
        }
    }, [contacts, service]);

    // BUG #4 (MEDIUM): Off-by-one — uses `currentPage * PAGE_SIZE` as the start index.
    // When currentPage=1 (first page), startIdx=10, so the first 10 contacts are skipped.
    const startIdx = currentPage * PAGE_SIZE; // BUG: should be (currentPage - 1) * PAGE_SIZE
    const paginatedContacts = filteredContacts.slice(startIdx, startIdx + PAGE_SIZE);

    const createContact = useCallback(async (contact: Omit<Contact, 'contactid'>) => {
        await service.createContact(contact);
        await loadContacts();
    }, [service, loadContacts]);

    const updateContact = useCallback(async (id: string, updates: Partial<Omit<Contact, 'contactid'>>) => {
        await service.updateContact(id, updates);
        await loadContacts();
    }, [service, loadContacts]);

    const deleteContact = useCallback(async (id: string) => {
        await service.deleteContact(id);
        setContacts(prev => prev.filter(c => c.contactid !== id));
        setFilteredContacts(prev => prev.filter(c => c.contactid !== id));
    }, [service]);

    return {
        contacts: paginatedContacts,
        allContacts: filteredContacts,
        loading,
        error,
        currentPage,
        totalPages: Math.ceil(filteredContacts.length / PAGE_SIZE),
        setCurrentPage,
        searchQuery,
        search,
        createContact,
        updateContact,
        deleteContact,
        loadContacts,
    };
}
