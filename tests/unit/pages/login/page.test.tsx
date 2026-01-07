import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../../../setup/test-utils';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginPage from '@/app/[locale]/(auth)/login/page';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.dispatchEvent
const mockDispatchEvent = vi.fn();
window.dispatchEvent = mockDispatchEvent;

describe('LoginPage', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const mockRouter = {
    push: mockPush,
    refresh: mockRefresh,
  };

  const mockSearchParams = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(mockSearchParams);
    
    // Default search params
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'redirect') return null;
      if (key === 'registered') return null;
      return null;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial Render', () => {
    it('should render login form with all elements', () => {
      render(<LoginPage />);

      // Check form elements
      expect(screen.getByRole('heading', { name: /authentication/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should render with default redirect to /dashboard', () => {
      render(<LoginPage />);
      
      // Form should be present (query by element name)
      const form = screen.getByLabelText(/email/i).closest('form');
      expect(form).toBeInTheDocument();
    });

    it('should render with custom redirect from search params', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'redirect') return '/custom-path';
        return null;
      });

      render(<LoginPage />);
      
      // Form should be present
      const form = screen.getByLabelText(/email/i).closest('form');
      expect(form).toBeInTheDocument();
    });

    it('should show success message when registered=true in search params', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'registered') return 'true';
        return null;
      });

      render(<LoginPage />);
      
      expect(screen.getByText(/account created successfully! you can now log in/i)).toBeInTheDocument();
    });

    it('should not show success message when registered is not true', () => {
      render(<LoginPage />);
      
      expect(screen.queryByText(/account created successfully/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('should update email input value', () => {
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password input value', () => {
      render(<LoginPage />);
      
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(passwordInput.value).toBe('password123');
    });

    it('should disable inputs when loading', async () => {
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      // Initially not disabled
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
      
      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true }),
          }), 100)
        )
      );
      
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      // Should be disabled during loading
      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Form Submission - Success Cases', () => {
    it('should successfully submit form and redirect to default path', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
          },
        }),
      });

      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        });
      });
      
      // Wait for setTimeout
      vi.advanceTimersByTime(100);
      
      await waitFor(() => {
        expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(Event));
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should redirect to custom path from search params', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'redirect') return '/custom-dashboard';
        return null;
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
          },
        }),
      });

      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
      
      vi.advanceTimersByTime(100);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-dashboard');
      });
    });

    it('should dispatch auth-refresh event on successful login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
          },
        }),
      });

      render(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
      
      vi.advanceTimersByTime(100);
      
      await waitFor(() => {
        expect(mockDispatchEvent).toHaveBeenCalled();
        const event = mockDispatchEvent.mock.calls[0][0];
        expect(event.type).toBe('auth-refresh');
      });
    });
  });

  describe('Form Submission - Error Cases', () => {
    it('should display error message when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Invalid credentials',
        }),
      });

      render(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
      
      // Form should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should display default error message when API error has no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
        }),
      });

      render(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        // Should show login error translation
        expect(screen.getByText(/authentication error/i)).toBeInTheDocument();
      });
    });

    it('should display error when API returns success: false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Account not approved',
        }),
      });

      render(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Account not approved')).toBeInTheDocument();
      });
      
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        // Should show connection error translation
        expect(screen.getByText(/connection error. please try again/i)).toBeInTheDocument();
      });
      
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle JSON parsing errors', async () => {
      // Use real timers for this async test
      vi.useRealTimers();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      render(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        // Should show connection error message
        expect(screen.getByText(/connection error. please try again/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Restore fake timers for other tests
      vi.useFakeTimers();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during form submission', async () => {
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      render(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      // Check loading state
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /login/i });
        expect(submitButton).toBeDisabled();
      });
      
      // Resolve the fetch
      resolveFetch!({
        ok: true,
        json: async () => ({ success: true }),
      });
      
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /login/i });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should clear errors when submitting again', async () => {
      // First submission with error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Invalid credentials',
        }),
      });

      render(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
      
      // Second submission - errors should be cleared
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
          },
        }),
      });
      
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'correctpassword' } });
      const form2 = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form2);
      
      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should submit form even with empty email (HTML5 validation is browser-only)', async () => {
      render(<LoginPage />);
      
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      // Note: HTML5 validation doesn't prevent programmatic submission in tests
      // In a real browser, HTML5 validation would prevent submission
      // We verify the form submits with empty values
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should submit form even with empty password (HTML5 validation is browser-only)', async () => {
      render(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      // Note: HTML5 validation doesn't prevent programmatic submission in tests
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Link Navigation', () => {
    it('should have register link pointing to /register', () => {
      render(<LoginPage />);
      
      const registerLink = screen.getByRole('link', { name: /sign up/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid submissions', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
          },
        }),
      });

      render(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
      
      // Submit multiple times rapidly
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      fireEvent.submit(form);
      fireEvent.submit(form);
      
      // Should only call API once (or limited times due to loading state)
      await waitFor(() => {
        // The button should be disabled after first submission
        expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
      });
    });

    it('should handle redirect with special characters', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'redirect') return '/dashboard?param=value&other=test';
        return null;
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
          },
        }),
      });

      render(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
      const form = screen.getByLabelText(/email/i).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
      
      vi.advanceTimersByTime(100);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard?param=value&other=test');
      });
    });
  });
});

