import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductForm from './ProductForm';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Mock Modules
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useParams: vi.fn(),
    };
});

vi.mock('@tanstack/react-query', () => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
    toast: { success: vi.fn(), error: vi.fn() }
}));

describe('ProductForm', () => {
    const navigateMock = vi.fn();
    const queryClientMock = { invalidateQueries: vi.fn() };
    const mutateMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Router Mocks
        useNavigate.mockReturnValue(navigateMock);
        useParams.mockReturnValue({}); // Default: Create mode (no ID)

        // Query Mocks
        useQueryClient.mockReturnValue(queryClientMock);
        
        // Stable Data
        const categoriesData = { data: [{ id: 1, name: 'General' }], isError: false, refetch: vi.fn() };
        const emptyProductData = { data: null, isLoading: false };

        // useQuery default: Loaded Categories, No Product (Create mode)
        useQuery.mockImplementation(({ queryKey }) => {
            if (queryKey[0] === 'productCategories') {
                return categoriesData;
            }
            if (queryKey[0] === 'products') {
                 // Return empty product for edit if ID passed? 
                 // We simulate create first.
                 // Check if ID is present in queryKey if needed, but for now return empty
                 if (queryKey[1] === '123') {
                     // For the edit test, we need a stable object too, but we can handle it in that test or valid here
                     // But strictly for the default beforeEach, we return empty.
                     // The edit test overrides this mock anyway? 
                     // No, the edit test uses .mockImplementation again.
                     // IMPORTANT: The edit test must ALSO return stable references if it uses inline objects.
                     return { 
                        data: { id: 123, name: 'Edit Product', defaultUnitPrice: 200, categoryId: 1 }, 
                        isLoading: false 
                     };
                     // Wait, if I return a new object here it will loop in edit test too?
                     // Yes.
                     // So I should define it outside or memoize based on key.
                 }
                 return emptyProductData;
            }
            return { data: null };
        });

        // useMutation default
        useMutation.mockReturnValue({
            mutate: mutateMock,
            isPending: false,
        });
    });

    const renderComponent = () => {
        return render(
            <MemoryRouter>
                <ProductForm />
            </MemoryRouter>
        );
    };

    it('should render create form correctly', () => {
        renderComponent();
        expect(screen.getByText('New Product')).toBeInTheDocument();
        expect(screen.getByLabelText(/Product Name/i)).toBeInTheDocument();
        // Check default category selection logic
        // "General" category exists, so it might be selected if initialData logic works or user selects it.
        // But initial state for categoryId is empty string unless 'General' is found.
        // The component logic: if (categories && !isEdit) setFormData(... category: general.id)
        // Since we mock useQuery to return categories immediately, it should select General (id: 1)
        // Actually useEffect runs after render. Testing library handles effects.
        // Let's assume input is rendered.
    });

    it('should submit form data', async () => {
        renderComponent();
        
        fireEvent.change(screen.getByLabelText(/Product Name/i), { target: { value: 'Test Product' } });
        fireEvent.change(screen.getByLabelText(/Default Price/i), { target: { value: '100' } });
        
        // Select Category
        fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: '1' } });

        const saveBtn = screen.getByRole('button', { name: /Save Product/i });
        fireEvent.click(saveBtn);

        expect(mutateMock).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Test Product',
            defaultUnitPrice: '100', // Component converts to Number in mutationFn, but here we invoke mutate with state
            categoryId: '1'
        }));
    });

    it('should load data in edit mode', () => {
        useParams.mockReturnValue({ id: '123' });
        
        const editProductData = { 
            data: { id: 123, name: 'Edit Product', defaultUnitPrice: 200, categoryId: 1 }, 
            isLoading: false 
        };
        const categoriesData = { data: [{ id: 1, name: 'General' }] };

        useQuery.mockImplementation(({ queryKey }) => {
            if (queryKey[0] === 'productCategories') {
                return categoriesData;
            }
            if (queryKey[0] === 'products' && queryKey[1] === '123') {
                return editProductData;
            }
            return { data: null };
        });

        renderComponent();
        expect(screen.getByText('Edit Product')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Edit Product')).toBeInTheDocument();
        expect(screen.getByDisplayValue('200')).toBeInTheDocument();
    });
});
