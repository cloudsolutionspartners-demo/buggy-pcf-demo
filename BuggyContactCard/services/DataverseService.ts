import { Contact, ContactCreate, ContactUpdate } from '../types/Contact';

export class DataverseService {
    private context: ComponentFramework.Context<ComponentFramework.PropertyTypes.StringProperty>;

    constructor(context: ComponentFramework.Context<ComponentFramework.PropertyTypes.StringProperty>) {
        this.context = context;
    }

    async getContacts(): Promise<Contact[]> {
        const result = await this.context.webAPI.retrieveMultipleRecords(
            'contact',
            '?$select=contactid,fullname,emailaddress1,telephone1,jobtitle,parentcustomerid'
        );
        return result.entities.map((e: ComponentFramework.WebApi.Entity) => ({
            contactid: e['contactid'] as string,
            fullname: e['fullname'] as string,
            email: e['emailaddress1'] as string,
            phone: e['telephone1'] as string,
            jobtitle: e['jobtitle'] as string,
            company: (e['parentcustomerid_FormattedValue'] as string) || '',
        }));
    }

    async searchContacts(query: string): Promise<Contact[]> {
        const filter = `?$filter=contains(fullname,'${query}') or contains(emailaddress1,'${query}')`;
        const result = await this.context.webAPI.retrieveMultipleRecords('contact', filter);
        return result.entities.map((e: ComponentFramework.WebApi.Entity) => ({
            contactid: e['contactid'] as string,
            fullname: e['fullname'] as string,
            email: e['emailaddress1'] as string,
            phone: e['telephone1'] as string,
            jobtitle: e['jobtitle'] as string,
            company: (e['parentcustomerid_FormattedValue'] as string) || '',
        }));
    }

    // BUG #7 (MEDIUM): Missing await — result is a Promise, so .id is undefined
    async createContact(contact: ContactCreate): Promise<Contact> {
        const record: ComponentFramework.WebApi.Entity = {
            fullname: contact.fullname,
            emailaddress1: contact.email,
            telephone1: contact.phone,
            jobtitle: contact.jobtitle,
        };
        const result = await this.context.webAPI.createRecord('contact', record);
        return { ...contact, contactid: (result as unknown as { id: string }).id };
    }

    async updateContact(contactid: string, updates: ContactUpdate): Promise<void> {
        const record: ComponentFramework.WebApi.Entity = {};
        if (updates.fullname !== undefined) record['fullname'] = updates.fullname;
        if (updates.email !== undefined) record['emailaddress1'] = updates.email;
        if (updates.phone !== undefined) record['telephone1'] = updates.phone;
        if (updates.jobtitle !== undefined) record['jobtitle'] = updates.jobtitle;
        await this.context.webAPI.updateRecord('contact', contactid, record);
    }

    async deleteContact(contactid: string): Promise<void> {
        await this.context.webAPI.deleteRecord('contact', contactid);
    }
}
