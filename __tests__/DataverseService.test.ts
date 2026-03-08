import { DataverseService } from '../BuggyContactCard/services/DataverseService';

// ---------------------------------------------------------------------------
// Mock PCF context & webAPI
// ---------------------------------------------------------------------------

const mockWebAPI = {
    retrieveMultipleRecords: jest.fn(),
    createRecord: jest.fn(),
    updateRecord: jest.fn(),
    deleteRecord: jest.fn(),
};

const mockContext = { webAPI: mockWebAPI } as any;

const makeService = () => new DataverseService(mockContext);

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// getContacts
// ---------------------------------------------------------------------------

describe('DataverseService.getContacts', () => {
    it('maps entity fields to the Contact interface', async () => {
        mockWebAPI.retrieveMultipleRecords.mockResolvedValue({
            entities: [
                {
                    contactid: 'abc',
                    fullname: 'Alice',
                    emailaddress1: 'alice@example.com',
                    telephone1: '5550001111',
                    jobtitle: 'Engineer',
                    parentcustomerid_FormattedValue: 'Acme Corp',
                },
            ],
        });

        const contacts = await makeService().getContacts();

        expect(contacts).toHaveLength(1);
        expect(contacts[0]).toEqual({
            contactid: 'abc',
            fullname: 'Alice',
            email: 'alice@example.com',
            phone: '5550001111',
            jobtitle: 'Engineer',
            company: 'Acme Corp',
        });
    });
});

// ---------------------------------------------------------------------------
// createContact — CATCHES BUG #7: missing await causes .id to be undefined
// ---------------------------------------------------------------------------

describe('DataverseService.createContact', () => {
    it('returns the contact with the server-assigned contactid', async () => {
        mockWebAPI.createRecord.mockResolvedValue({ id: 'server-id-999' });

        const service = makeService();
        const created = await service.createContact({
            fullname: 'Bob',
            email: 'bob@example.com',
            phone: '5550002222',
            jobtitle: 'Manager',
            company: 'Beta Inc',
        });

        // BUG #7: without `await`, result is a Promise and .id is undefined,
        //         so created.contactid becomes undefined.
        expect(created.contactid).toBe('server-id-999');
    });

    it('passes the mapped record to createRecord', async () => {
        mockWebAPI.createRecord.mockResolvedValue({ id: 'x' });

        await makeService().createContact({
            fullname: 'Bob',
            email: 'bob@example.com',
            phone: '555',
            jobtitle: 'Dev',
            company: '',
        });

        expect(mockWebAPI.createRecord).toHaveBeenCalledWith(
            'contact',
            expect.objectContaining({ fullname: 'Bob', emailaddress1: 'bob@example.com' })
        );
    });
});

// ---------------------------------------------------------------------------
// updateContact — CATCHES BUG #6: createRecord used instead of updateRecord
// ---------------------------------------------------------------------------

describe('DataverseService.updateContact', () => {
    it('calls webAPI.updateRecord (not createRecord) when updating a contact', async () => {
        mockWebAPI.updateRecord.mockResolvedValue({});

        const service = makeService();
        await service.updateContact('contact-123', { fullname: 'Updated Name' });

        // BUG #6: the implementation calls createRecord instead of updateRecord.
        expect(mockWebAPI.updateRecord).toHaveBeenCalledWith(
            'contact',
            'contact-123',
            expect.objectContaining({ fullname: 'Updated Name' })
        );
        expect(mockWebAPI.createRecord).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// deleteContact
// ---------------------------------------------------------------------------

describe('DataverseService.deleteContact', () => {
    it('calls deleteRecord with the correct entity name and id', async () => {
        mockWebAPI.deleteRecord.mockResolvedValue({});

        await makeService().deleteContact('del-456');

        expect(mockWebAPI.deleteRecord).toHaveBeenCalledWith('contact', 'del-456');
    });
});
