import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContactCard } from '../BuggyContactCard/components/ContactCard';
import { Contact } from '../BuggyContactCard/types/Contact';

const sampleContact: Contact = {
    contactid: '1',
    fullname: 'Alice Smith',
    email: 'alice@example.com',
    phone: '5550001111',
    jobtitle: 'Engineer',
    company: 'Acme Corp',
};

// ---------------------------------------------------------------------------
// CATCHES BUG #1: `contact.emal` typo — email element will be empty / undefined
// ---------------------------------------------------------------------------

describe('ContactCard', () => {
    it('renders the contact email address', () => {
        render(<ContactCard contact={sampleContact} />);

        // BUG #1: the component reads `contact.emal` (typo), so this is undefined
        //         and the email element renders blank.
        expect(screen.getByTestId('contact-email')).toHaveTextContent('alice@example.com');
    });

    it('renders the contact full name', () => {
        render(<ContactCard contact={sampleContact} />);
        expect(screen.getByRole('heading', { name: /alice smith/i })).toBeInTheDocument();
    });

    it('renders the phone number', () => {
        render(<ContactCard contact={sampleContact} />);
        expect(screen.getByTestId('contact-phone')).toHaveTextContent('5550001111');
    });

    it('renders the job title', () => {
        render(<ContactCard contact={sampleContact} />);
        expect(screen.getByTestId('contact-jobtitle')).toHaveTextContent('Engineer');
    });

    it('renders the company', () => {
        render(<ContactCard contact={sampleContact} />);
        expect(screen.getByTestId('contact-company')).toHaveTextContent('Acme Corp');
    });

    it('renders Edit and Delete buttons when handlers are provided', () => {
        render(
            <ContactCard
                contact={sampleContact}
                onEdit={jest.fn()}
                onDelete={jest.fn()}
            />
        );
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
});
