// BUG #2 (SIMPLE): Wrong variable reference — `phoneNum` is not defined, should be `phone`
export function formatPhoneNumber(phone: string): string {
    // @ts-ignore
    const cleaned = phoneNum.replace(/\D/g, ''); // BUG: phoneNum is undefined
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
}

export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}
