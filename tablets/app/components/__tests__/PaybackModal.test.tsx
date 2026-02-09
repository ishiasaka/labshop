import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PaybackModal from '../PaybackModal';
import { LanguageProvider } from '../../context/LanguageContext';
import '@testing-library/jest-dom';

describe('PaybackModal', () => {
  const mockUserData = {
    name: 'Test Student',
    id: '12345',
    owedAmount: 3000,
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    mockOnClose.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders correctly with user data', () => {
    render(
      <LanguageProvider>
        <PaybackModal
          open={true}
          onClose={mockOnClose}
          userData={mockUserData}
        />
      </LanguageProvider>
    );

    expect(screen.getByText('Pay back amount')).toBeInTheDocument();
    expect(screen.getByText('Test Student')).toBeInTheDocument();
    // Use flexible matcher for amount due to locale formatting potential
    expect(
      screen.getByText((content) => content.includes('3,000'))
    ).toBeInTheDocument();
    expect(screen.getByText('¥100')).toBeInTheDocument();
    expect(screen.getByText('¥200')).toBeInTheDocument();
    expect(screen.getByText('¥500')).toBeInTheDocument();
  });

  it('triggers payment flow when preset is clicked', async () => {
    render(
      <LanguageProvider>
        <PaybackModal
          open={true}
          onClose={mockOnClose}
          userData={mockUserData}
        />
      </LanguageProvider>
    );

    // Click preset
    fireEvent.click(screen.getByText('¥100'));

    // Should show processing
    expect(screen.getByText('Payment processing...')).toBeInTheDocument();

    // Fast-forward processing time (1.5s)
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // Should show success
    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();

    // Fast-forward auto-close time (2.0s)
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('allows manual entry through "Other" option', async () => {
    render(
      <LanguageProvider>
        <PaybackModal
          open={true}
          onClose={mockOnClose}
          userData={mockUserData}
        />
      </LanguageProvider>
    );

    // Click Other
    fireEvent.click(screen.getByText('Other Amount'));

    // Input appears
    const input = screen.getByPlaceholderText('Enter amount');
    expect(input).toBeInTheDocument();

    // Enter amount
    fireEvent.change(input, { target: { value: '1500' } });

    // Submit
    fireEvent.click(screen.getByText('Confirm Payment'));

    // Processing
    expect(screen.getByText('Payment processing...')).toBeInTheDocument();

    // Finish flow
    act(() => {
      jest.advanceTimersByTime(3500); // 1.5s + 2.0s
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not close when clicking close button during processing', () => {
    render(
      <LanguageProvider>
        <PaybackModal
          open={true}
          onClose={mockOnClose}
          userData={mockUserData}
        />
      </LanguageProvider>
    );

    // Start payment
    fireEvent.click(screen.getByText('¥100'));
    expect(screen.getByText('Payment processing...')).toBeInTheDocument();

    // Try to close (finding by icon usually requires looking for the SVG or button role)
    // The close button is the only IconButton at the top right usually.
    // We can look for the CloseIcon's testid or the button itself.
    // Material UI IconButtons usually have a role="button".
    // Let's assume there are multiple buttons, but the close one is usually identifiable.
    // Or we can query by the `disabled` state derived from logic.
    // In our code: <IconButton ... disabled={paymentStatus === 'processing'}>

    // We can try to click all buttons, or target the specific one if we add aria-label.
    // Since we didn't add aria-label, let's look for the disabled button.
    const closeButtons = screen.getAllByRole('button');
    // The preset buttons are not disabled, only the close icon button is.
    // Actually, buttons are not disabled in code, only the close button is disabled during processing.
    // Let's just check if there is a disabled button.
    const disabledButton = closeButtons.find((b) => b.hasAttribute('disabled'));
    expect(disabledButton).toBeDefined();

    if (disabledButton) {
      fireEvent.click(disabledButton);
      expect(mockOnClose).not.toHaveBeenCalled();
    }
  });
});
