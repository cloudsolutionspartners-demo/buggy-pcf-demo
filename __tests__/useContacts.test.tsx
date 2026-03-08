import { renderHook, act, waitFor } from '@testing-library/react';
import { useContacts } from '../BuggyContactCard/hooks/useContacts';
import { Contact } from '../BuggyContactCard/types/Contact';
import { DataverseService } from '../BuggyContactCard/services/DataverseService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeContact = (id: string, fullname: string): Contact => ({
    contactid: id,
    fullname,
    email: `${id}@example.com`,
    phone: '5550001111',
    jobtitle: 'Developer',
    company: 'Acme',
});

const alice = makeContact('1', 'Alice');
const bob = makeContact('2', 'Bob');

// ---------------------------------------------------------------------------
// Mock service
// ---------------------------------------------------------------------------

const mockService = {
    getContacts: jest.fn(),
    searchContacts: jest.fn(),
    createContact: jest.fn(),
    updateContact: jest.fn(),
    deleteContact: jest.fn(),
} as unknown as DataverseService;

beforeEach(() => {
    jest.clearAllMocks();
    (mockService.getContacts as jest.Mock).mockResolvedValue([]);
});

// Wait for the initial loadContacts() to complete:
// poll until getContacts has been called AND loading has returned to false.
const flushLoad = () =>
    waitFor(() => {
        expect(mockService.getContacts).toHaveBeenCalled();
        expect((mockService.getContacts as jest.Mock).mock.results[0].value).resolves.toBeDefined();
    });

// ---------------------------------------------------------------------------
// Pagination — CATCHES BUG #4: off-by-one (startIdx = page*size instead of (page-1)*size)
// ---------------------------------------------------------------------------

describe('pagination', () => {
    it('returns the first 10 contacts when on page 1', async () => {
        const contacts = Array.from({ length: 15 }, (_, i) =>
            makeContact(String(i), `Contact ${i}`)
        );
        (mockService.getContacts as jest.Mock).mockResolvedValue(contacts);

        const { result } = renderHook(() => useContacts(mockService));

        // Wait for all 15 contacts to be loaded
        await waitFor(() => expect(result.current.allContacts).toHaveLength(15));

        // BUG #4: startIdx = 1 * 10 = 10, so items [10..14] are returned (5 items),
        //         not items [0..9] (10 items). The first page is completely skipped.
        expect(result.current.contacts).toHaveLength(10);
        expect(result.current.contacts[0].contactid).toBe('0');
    });

    it('reports the correct totalPages for 15 contacts', async () => {
        const contacts = Array.from({ length: 15 }, (_, i) =>
            makeContact(String(i), `Contact ${i}`)
        );
        (mockService.getContacts as jest.Mock).mockResolvedValue(contacts);

        const { result } = renderHook(() => useContacts(mockService));
        await waitFor(() => expect(result.current.allContacts).toHaveLength(15));

        expect(result.current.totalPages).toBe(2);
    });
});

// ---------------------------------------------------------------------------
// Race condition — CATCHES BUG #8: no AbortController, stale results overwrite
// ---------------------------------------------------------------------------

describe('search race condition', () => {
    it('does not overwrite results when a slower earlier search resolves after a later one', async () => {
        let resolveSearch1!: (contacts: Contact[]) => void;
        let resolveSearch2!: (contacts: Contact[]) => void;

        const search1Done = new Promise<Contact[]>(resolve => { resolveSearch1 = resolve; });
        const search2Done = new Promise<Contact[]>(resolve => { resolveSearch2 = resolve; });

        (mockService.searchContacts as jest.Mock)
            .mockReturnValueOnce(search1Done)   // 'a'  search — will resolve LAST
            .mockReturnValueOnce(search2Done);  // 'ab' search — will resolve FIRST

        (mockService.getContacts as jest.Mock).mockResolvedValue([alice, bob]);
        const { result } = renderHook(() => useContacts(mockService));
        await waitFor(() => expect(result.current.allContacts).toHaveLength(2));

        // Fire two searches in quick succession (both are in-flight simultaneously)
        act(() => { void result.current.search('a'); });
        act(() => { void result.current.search('ab'); });

        // Newer search ('ab') resolves first — only alice matches
        await act(async () => { resolveSearch2([alice]); });
        expect(result.current.allContacts).toEqual([alice]);

        // Older search ('a') resolves last — alice + bob match
        await act(async () => { resolveSearch1([alice, bob]); });

        // BUG #8: without cancellation the stale 'a' results overwrite 'ab' results.
        // Correct behaviour: should still show only the 'ab' result.
        expect(result.current.allContacts).toEqual([alice]);
    });
});

// ---------------------------------------------------------------------------
// Memory leak — CATCHES BUG #10: clearInterval not called on unmount
// ---------------------------------------------------------------------------

describe('polling interval cleanup', () => {
    it('clears the polling interval when the component unmounts', async () => {
        jest.useFakeTimers();
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

        const { unmount } = renderHook(() => useContacts(mockService));

        // With fake timers, flush the async loadContacts() promise chain manually
        await act(async () => {
            // Each await tick lets one Promise in the async chain resolve
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        unmount();

        // BUG #10: without `return () => clearInterval(interval)` in the useEffect,
        //          clearInterval is never called and the timer keeps firing after unmount.
        expect(clearIntervalSpy).toHaveBeenCalled();

        clearIntervalSpy.mockRestore();
        jest.useRealTimers();
    });
});

// ---------------------------------------------------------------------------
// CRUD operations (not directly testing bugs, verifying core behaviour)
// ---------------------------------------------------------------------------

describe('createContact', () => {
    it('reloads contacts after creating', async () => {
        const newContact = { fullname: 'Dave', email: 'd@ex.com', phone: '555', jobtitle: 'QA', company: '' };
        (mockService.createContact as jest.Mock).mockResolvedValue({ contactid: 'new-1', ...newContact });
        (mockService.getContacts as jest.Mock)
            .mockResolvedValueOnce([alice])
            .mockResolvedValue([alice, { contactid: 'new-1', ...newContact }]);

        const { result } = renderHook(() => useContacts(mockService));
        await waitFor(() => expect(result.current.allContacts).toHaveLength(1));

        await act(async () => { await result.current.createContact(newContact); });

        expect(mockService.createContact).toHaveBeenCalledWith(newContact);
        expect(mockService.getContacts).toHaveBeenCalledTimes(2); // initial + after create
    });
});

describe('deleteContact', () => {
    it('removes the contact from allContacts immediately', async () => {
        (mockService.getContacts as jest.Mock).mockResolvedValue([alice, bob]);
        (mockService.deleteContact as jest.Mock).mockResolvedValue(undefined);

        const { result } = renderHook(() => useContacts(mockService));
        await waitFor(() => expect(result.current.allContacts).toHaveLength(2));

        await act(async () => { await result.current.deleteContact('1'); });

        expect(result.current.allContacts.map(c => c.contactid)).not.toContain('1');
    });
});

describe('search (reset)', () => {
    it('resets filteredContacts when query is cleared', async () => {
        (mockService.getContacts as jest.Mock).mockResolvedValue([alice, bob]);
        (mockService.searchContacts as jest.Mock).mockResolvedValue([alice]);

        const { result } = renderHook(() => useContacts(mockService));
        await waitFor(() => expect(result.current.allContacts).toHaveLength(2));

        await act(async () => { await result.current.search('Alice'); });
        expect(result.current.allContacts).toHaveLength(1);

        await act(async () => { await result.current.search(''); });
        expect(result.current.allContacts).toHaveLength(2);
    });
});
