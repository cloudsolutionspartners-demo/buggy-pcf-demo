import React from 'react';
import { Contact } from '../types/Contact';
import { ContactCard } from './ContactCard';

interface ContactListProps {
    contacts: Contact[];
    searchQuery?: string;
    sortKey?: keyof Contact;
    onEdit?: (contact: Contact) => void;
    onDelete?: (contactId: string) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
    contacts,
    searchQuery = '',
    sortKey,
    onEdit,
    onDelete,
}) => {
    // BUG #11 (COMPLEX): Array mutation — `.sort()` mutates the original array in place.
    // Callers' array reference is silently modified, causing subtle state corruption.
    let displayContacts = contacts;
    if (sortKey) {
        displayContacts = contacts.sort((a, b) => { // BUG: should be [...contacts].sort(...)
            const av = String(a[sortKey] ?? '');
            const bv = String(b[sortKey] ?? '');
            return av.localeCompare(bv);
        });
    }

    // BUG #5 (MEDIUM): Inverted boolean — `!includes` shows contacts that do NOT match
    // the query instead of contacts that DO match.
    const visibleContacts = searchQuery
        ? displayContacts.filter(
              c => !c.fullname.toLowerCase().includes(searchQuery.toLowerCase()) // BUG: should not have !
          )
        : displayContacts;

    if (visibleContacts.length === 0) {
        return <p data-testid="empty-list">No contacts found.</p>;
    }

    return (
        <ul data-testid="contact-list">
            {visibleContacts.map(contact => (
                <li key={contact.contactid}>
                    <ContactCard contact={contact} onEdit={onEdit} onDelete={onDelete} />
                </li>
            ))}
        </ul>
    );
};
