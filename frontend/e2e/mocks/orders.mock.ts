
export const mockOrderStandard = {
    id: 123,
    orderNo: 'ORD-123',
    customer: { id: 1, name: 'Mock Customer', address: '123 Mock St', phone: '9999999999' },
    orderDate: '2025-01-01',
    createdAt: '2025-01-01T10:00:00Z',
    dueDate: '2025-01-15T10:00:00Z',
    items: [
       { id: 1, productId: 1, productName: 'Mock Item', quantity: 2, unitPrice: 100, lineTotal: 200, description: 'Test Desc' }
    ],
    totalAmount: 200,
    paidAmount: 0,
    status: 'confirmed',
    discount: 0,
    notes: 'Test Notes'
};

export const mockAuthUser = {
    id: 1, 
    username: 'admin', 
    role: 'ADMIN' 
};
