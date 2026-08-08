import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the empty state with suggestion chips', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { name: /what can i help with\?/i })
  ).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/ask me anything/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Draft an email' })).toBeInTheDocument();
});
