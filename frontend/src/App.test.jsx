import { render, screen } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('renders without crashing and redirects to orders', async () => {
    // Render the App
    render(<App />);

    // Since it redirects to /orders, and OrdersList shows "Loading orders..." 
    // we should expect to see that loading state or at least not crash.
    expect(await screen.findByText(/Loading orders/i)).toBeInTheDocument();
  });
});
