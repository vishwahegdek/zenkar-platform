import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductsList from './ProductsList';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
  useInfiniteQuery: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe('ProductsList Category Priority and Selection', () => {
  const queryClientMock = { invalidateQueries: vi.fn() };
  const mockCategories = [
    { id: 1, name: 'Bee boxes' },
    { id: 2, name: 'General' },
    { id: 3, name: 'Furniture' },
    { id: 4, name: 'Doors & Frames' },
    { id: 5, name: 'Beekeeping' },
  ];

  const mockProducts = [
    { id: 101, name: 'Dining Table', categoryId: 3, defaultUnitPrice: 12000, category: { name: 'Furniture' } },
    { id: 102, name: 'Door Frame', categoryId: 4, defaultUnitPrice: 4500, category: { name: 'Doors & Frames' } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useQueryClient.mockReturnValue(queryClientMock);
    useMutation.mockReturnValue({ mutate: vi.fn() });

    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'productCategories') {
        return { data: mockCategories, isSuccess: true, isError: false };
      }
      return { data: [], isSuccess: true, isError: false };
    });

    useInfiniteQuery.mockImplementation(({ queryKey }) => {
      const selectedCat = queryKey[2];
      const filtered = selectedCat
        ? mockProducts.filter((p) => String(p.categoryId) === String(selectedCat))
        : mockProducts;

      return {
        data: {
          pages: [{ data: filtered, meta: { page: 1, totalPages: 1 } }],
        },
        isLoading: false,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        refetch: vi.fn(),
      };
    });
  });

  it('renders All Categories first, then prioritizes Doors & Frames, then Furniture, followed by other categories', async () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <ProductsList />
      </MemoryRouter>
    );

    // Get all category buttons
    const allButtons = screen.getAllByRole('button');
    const categoryButtonTexts = allButtons
      .map((b) => b.textContent.trim())
      .filter((text) =>
        ['All Categories', 'Doors & Frames', 'Furniture', 'Bee boxes', 'Beekeeping', 'General'].includes(text)
      );

    expect(categoryButtonTexts).toEqual([
      'All Categories',
      'Doors & Frames',
      'Furniture',
      'Bee boxes',
      'Beekeeping',
      'General',
    ]);
  });

  it('selects Furniture tab by default when entering product catalogue fresh', async () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <ProductsList />
      </MemoryRouter>
    );

    // Verify useInfiniteQuery received furniture category ID (3)
    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['products', '', '3'],
      })
    );

    // The Furniture button should have active styles (bg-blue-600)
    const furnitureBtn = screen.getByRole('button', { name: 'Furniture' });
    expect(furnitureBtn.className).toContain('bg-blue-600');

    // All Categories should NOT have active styles
    const allCatBtn = screen.getByRole('button', { name: 'All Categories' });
    expect(allCatBtn.className).not.toContain('bg-blue-600');
  });

  it('allows switching to All Categories when clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <ProductsList />
      </MemoryRouter>
    );

    const allCatBtn = screen.getByRole('button', { name: 'All Categories' });
    fireEvent.click(allCatBtn);

    // Query should now be invoked for all categories (undefined)
    await waitFor(() => {
      expect(useInfiniteQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['products', '', undefined],
        })
      );
    });
  });

  it('respects explicitly provided category param from URL', async () => {
    render(
      <MemoryRouter initialEntries={['/products?category=4']}>
        <ProductsList />
      </MemoryRouter>
    );

    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['products', '', '4'],
      })
    );

    const doorsBtn = screen.getByRole('button', { name: 'Doors & Frames' });
    expect(doorsBtn.className).toContain('bg-blue-600');

    const furnitureBtn = screen.getByRole('button', { name: 'Furniture' });
    expect(furnitureBtn.className).not.toContain('bg-blue-600');
  });
});
