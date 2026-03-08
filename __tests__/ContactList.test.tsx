import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContactList } from '../BuggyContactCard/components/ContactList';
import { Contact } from '../BuggyContactCard/types/Contact';

const alice: Contact = { contactid: '1', fullname: 'Alice', email: 'a@ex.com', phone: '111', jobtitle: 'Dev', company: 'A' };
const bob: Contact   = { contactid: '2', fullname: 'Bob',   email: 'b@ex.com', phone: '222', jobtitle: 'PM',  company: 'B' };
const charlie: Contact = { contactid: '3', fullname: 'Charlie', email: 'c@ex.com', phone: '333', jobtitle: 'QA', company: 'C' };

// ---------------------------------------------------------------------------
// Search filter — CATCHES BUG #5: inverted boolean (`!includes` instead of `includes`)
// ---------------------------------------------------------------------------

describe('ContactList search filter', () => {
    it('shows only contacts whose fullname matches the searchQuery', () => {
        render(<ContactList contacts={[alice, bob, charlie]} searchQuery="Alice" />);

        // BUG #5: `!fullname.includes(query)` is used, so Alice is EXCLUDED and
        //         Bob & Charlie are shown instead.
        expect(screen.queryAllByTestId('contact-card')).toHaveLength(1);
        expect(screen.getByRole('heading', { name: /alice/i })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: /bob/i })).not.toBeInTheDocument();
    });

    it('shows all contacts when searchQuery is empty', () => {
        render(<ContactList contacts={[alice, bob]} searchQuery="" />);
        expect(screen.queryAllByTestId('contact-card')).toHaveLength(2);
    });

    it('shows "No contacts found" when no contact matches', () => {
        render(<ContactList contacts={[alice, bob]} searchQuery="Zara" />);
        // BUG #5: with inverted logic ALL contacts will be shown for "Zara" (no match → all pass)
        expect(screen.getByTestId('empty-list')).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// Sorting — CATCHES BUG #11: array mutation (sort without copying)
// ---------------------------------------------------------------------------

describe('ContactList sorting', () => {
    it('does not mutate the original contacts array when sorting', () => {
        const contacts = [charlie, alice, bob]; // intentionally unsorted
        const originalOrder = contacts.map(c => c.contactid);

        render(<ContactList contacts={contacts} sortKey="fullname" />);

        // BUG #11: contacts.sort(...) mutates the array in place.
        // After rendering, the original array should be in its original order.
        expect(contacts.map(c => c.contactid)).toEqual(originalOrder);
    });

    it('renders contacts sorted by fullname ascending', () => {
        render(<ContactList contacts={[charlie, alice, bob]} sortKey="fullname" />);

        const headings = screen
            .getAllByRole('heading')
            .map(h => h.textContent);

        // Alice → Bob → Charlie
        expect(headings[0]).toMatch(/Alice/);
        expect(headings[1]).toMatch(/Bob/);
        expect(headings[2]).toMatch(/Charlie/);
    });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('ContactList empty state', () => {
    it('shows the empty message when contacts array is empty', () => {
        render(<ContactList contacts={[]} />);
        expect(screen.getByTestId('empty-list')).toBeInTheDocument();
    });
});
