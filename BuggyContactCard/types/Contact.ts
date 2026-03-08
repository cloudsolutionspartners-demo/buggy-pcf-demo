export interface Contact {
    contactid: string;
    fullname: string;
    email: string;
    phone: string;
    jobtitle: string;
    company: string;
}

export type ContactCreate = Omit<Contact, 'contactid'>;
export type ContactUpdate = Partial<ContactCreate>;
