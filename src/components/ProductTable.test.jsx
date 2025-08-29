import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductTable from './ProductTable';
import { BrowserRouter } from 'react-router-dom'; // Needed for components with Link

// Mock the Button component to simplify testing
vi.mock('./Button', () => ({
    default: ({ children, ...props }) => <button {...props}>{children}</button>
}));

describe('ProductTable', () => {
  const mockProducts = [
    { id: '1', name: 'Green Tea', sku: 'GT01', category: 'Beverages', quantity: 10, unit_price: 5.99 },
    { id: '2', name: 'Espresso Beans', sku: 'EB01', category: 'Coffee', quantity: 20, unit_price: 12.50 },
  ];

  it('renders product data correctly', () => {
    render(<ProductTable products={mockProducts} />);

    expect(screen.getByText('Green Tea')).toBeInTheDocument();
    expect(screen.getByText('Espresso Beans')).toBeInTheDocument();
    expect(screen.getByText('GT01')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('shows a message when there are no products', () => {
    render(<ProductTable products={[]} />);
    expect(screen.getByText('No products found.')).toBeInTheDocument();
  });
});