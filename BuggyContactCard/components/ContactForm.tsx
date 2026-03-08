import React, { useState, useEffect } from 'react';
import { Contact } from '../types/Contact';
// BUG #3 (SIMPLE): Wrong import name — imports `formatDate` instead of `formatPhoneNumber`.
// Phone numbers are formatted with a date formatter, producing "Invalid Date" output.
import { formatDate } from '../utils/formatters';

type ContactFormData = Omit<Contact, 'contactid'>;

interface ContactFormProps {
    initialValues?: Partial<ContactFormData>;
    onSubmit: (data: ContactFormData) => void;
    onCancel?: () => void;
}

const defaultValues: ContactFormData = {
    fullname: '',
    email: '',
    phone: '',
    jobtitle: '',
    company: '',
};

export const ContactForm: React.FC<ContactFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
}) => {
    const [formData, setFormData] = useState<ContactFormData>({
        ...defaultValues,
        ...initialValues,
    });

    // BUG #9 (COMPLEX): Stale closure — formData captured at mount time (initial values).
    // When user edits fields and presses Ctrl+Enter, onSubmit receives the stale initial
    // formData instead of the current field values.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                onSubmit(formData); // BUG: formData is stale (initial snapshot)
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []); // BUG: missing [formData, onSubmit] in deps

    const handleChange = (field: keyof ContactFormData) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Uses the wrong formatter (formatDate) due to bug #3
        const formatted = formatDate(e.target.value);
        setFormData(prev => ({ ...prev, phone: formatted }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} data-testid="contact-form">
            <label htmlFor="fullname">Full Name</label>
            <input
                id="fullname"
                type="text"
                value={formData.fullname}
                onChange={handleChange('fullname')}
                data-testid="input-fullname"
            />
            <label htmlFor="email">Email</label>
            <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                data-testid="input-email"
            />
            <label htmlFor="phone">Phone</label>
            <input
                id="phone"
                type="text"
                value={formData.phone}
                onChange={handlePhoneChange}
                data-testid="input-phone"
            />
            <label htmlFor="jobtitle">Job Title</label>
            <input
                id="jobtitle"
                type="text"
                value={formData.jobtitle}
                onChange={handleChange('jobtitle')}
                data-testid="input-jobtitle"
            />
            <label htmlFor="company">Company</label>
            <input
                id="company"
                type="text"
                value={formData.company}
                onChange={handleChange('company')}
                data-testid="input-company"
            />
            <button type="submit">Save</button>
            {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
        </form>
    );
};
