import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContactForm } from '../BuggyContactCard/components/ContactForm';

// ---------------------------------------------------------------------------
// Mock formatters so that:
//  • formatPhoneNumber  →  '(555) 123-4567'  (the expected correct output)
//  • formatDate         →  'INVALID_DATE'     (a clearly wrong phone representation)
// This isolates Bug #3 from Bug #2 (broken formatPhoneNumber implementation).
// ---------------------------------------------------------------------------

jest.mock('../BuggyContactCard/utils/formatters', () => ({
    formatPhoneNumber: jest.fn().mockReturnValue('(555) 123-4567'),
    formatDate: jest.fn().mockReturnValue('INVALID_DATE'),
    truncateText: jest.fn((t: string, max: number) => t.slice(0, max)),
}));

import * as formatters from '../BuggyContactCard/utils/formatters';

afterEach(() => {
    jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Wrong import — CATCHES BUG #3: `formatDate` imported instead of `formatPhoneNumber`
// ---------------------------------------------------------------------------

describe('ContactForm phone formatting (BUG #3)', () => {
    it('formats the phone field using formatPhoneNumber, not formatDate', () => {
        render(<ContactForm onSubmit={jest.fn()} />);

        const phoneInput = screen.getByTestId('input-phone');
        fireEvent.change(phoneInput, { target: { value: '5551234567' } });

        // BUG #3: the component imports `formatDate` and calls it with the phone value.
        //         formatDate is NOT supposed to be called with a phone string.
        expect(formatters.formatPhoneNumber).toHaveBeenCalledWith('5551234567');
        expect(formatters.formatDate).not.toHaveBeenCalledWith('5551234567');
    });

    it('displays the correctly formatted phone number after typing', () => {
        render(<ContactForm onSubmit={jest.fn()} />);

        const phoneInput = screen.getByTestId('input-phone');
        fireEvent.change(phoneInput, { target: { value: '5551234567' } });

        // BUG #3: with formatDate the field shows 'INVALID_DATE' instead of '(555) 123-4567'
        expect(phoneInput).toHaveValue('(555) 123-4567');
    });
});

// ---------------------------------------------------------------------------
// Stale closure — CATCHES BUG #9: Ctrl+Enter submits initial (stale) formData
// ---------------------------------------------------------------------------

describe('ContactForm Ctrl+Enter submission (BUG #9)', () => {
    it('submits the CURRENT form values when Ctrl+Enter is pressed', () => {
        const onSubmit = jest.fn();
        render(<ContactForm onSubmit={onSubmit} />);

        // User types a name after mount
        const nameInput = screen.getByTestId('input-fullname');
        fireEvent.change(nameInput, { target: { value: 'John Doe' } });

        const emailInput = screen.getByTestId('input-email');
        fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

        // Press Ctrl+Enter
        fireEvent.keyDown(document, { ctrlKey: true, key: 'Enter' });

        // BUG #9: the Ctrl+Enter handler captured formData at mount (all empty strings).
        //         onSubmit is called with { fullname: '', email: '' } instead of the updated values.
        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                fullname: 'John Doe',
                email: 'john@example.com',
            })
        );
    });

    it('does not submit stale initial data when the form has been edited', () => {
        const onSubmit = jest.fn();
        render(<ContactForm onSubmit={onSubmit} />);

        fireEvent.change(screen.getByTestId('input-fullname'), {
            target: { value: 'Jane Smith' },
        });

        fireEvent.keyDown(document, { ctrlKey: true, key: 'Enter' });

        const submittedData = onSubmit.mock.calls[0][0];

        // BUG #9: fullname is '' (empty) because stale closure captured initial formData
        expect(submittedData.fullname).not.toBe('');
        expect(submittedData.fullname).toBe('Jane Smith');
    });
});

// ---------------------------------------------------------------------------
// Normal submit button (no stale closure — this should always work)
// ---------------------------------------------------------------------------

describe('ContactForm submit button', () => {
    it('calls onSubmit with current field values when the Save button is clicked', () => {
        const onSubmit = jest.fn();
        render(<ContactForm onSubmit={onSubmit} />);

        fireEvent.change(screen.getByTestId('input-fullname'), {
            target: { value: 'Click Submit User' },
        });

        fireEvent.submit(screen.getByTestId('contact-form'));

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ fullname: 'Click Submit User' })
        );
    });
});

// ---------------------------------------------------------------------------
// Renders without crashing
// ---------------------------------------------------------------------------

describe('ContactForm rendering', () => {
    it('renders all form fields', () => {
        render(<ContactForm onSubmit={jest.fn()} />);

        expect(screen.getByTestId('input-fullname')).toBeInTheDocument();
        expect(screen.getByTestId('input-email')).toBeInTheDocument();
        expect(screen.getByTestId('input-phone')).toBeInTheDocument();
        expect(screen.getByTestId('input-jobtitle')).toBeInTheDocument();
        expect(screen.getByTestId('input-company')).toBeInTheDocument();
    });

    it('pre-fills fields from initialValues', () => {
        render(
            <ContactForm
                initialValues={{ fullname: 'Pre-filled', email: 'pre@ex.com' }}
                onSubmit={jest.fn()}
            />
        );
        expect(screen.getByTestId('input-fullname')).toHaveValue('Pre-filled');
        expect(screen.getByTestId('input-email')).toHaveValue('pre@ex.com');
    });
});
