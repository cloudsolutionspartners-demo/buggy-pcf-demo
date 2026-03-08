import React from 'react';
import { Contact } from '../types/Contact';

interface ContactCardProps {
    contact: Contact;
    onEdit?: (contact: Contact) => void;
    onDelete?: (contactId: string) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onEdit, onDelete }) => {
    return (
        <div className="contact-card" data-testid="contact-card">
            <h3>{contact.fullname}</h3>
            {/* BUG #1 (SIMPLE): Typo — `contact.emal` instead of `contact.email` */}
            <p data-testid="contact-email">{(contact as unknown as { emal: string }).emal}</p>
            <p data-testid="contact-phone">{contact.phone}</p>
            <p data-testid="contact-jobtitle">{contact.jobtitle}</p>
            <p data-testid="contact-company">{contact.company}</p>
            {onEdit && (
                <button onClick={() => onEdit(contact)}>Edit</button>
            )}
            {onDelete && (
                <button onClick={() => onDelete(contact.contactid)}>Delete</button>
            )}
        </div>
    );
};
