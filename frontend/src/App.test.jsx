import { render, screen } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('renders login page by default', async () => {
    // Render the App
    render(<App />);

    // Expect login page
    expect(await screen.findByText(/Login to Zenkar/i)).toBeInTheDocument();
  });
});
