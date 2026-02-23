import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import PaybackModal from '../PaybackModal';
import { LanguageProvider } from '../../context/LanguageContext';
import '@testing-library/jest-dom';

// ── Mock usePayment ───────────────────────────────────────────────────
const mockPay = jest.fn();
jest.mock('../../hooks/usePayment', () => ({
  usePayment: () => ({ pay: mockPay, isPaying: false, error: null }),
}));

// ── Helpers ───────────────────────────────────────────────────────────
const MOCK_USER = { name: 'Test Student', id: '12345', owedAmount: 3000 };

function renderModal(open = true, onClose = jest.fn()) {
  return {
    onClose,
    ...render(
      <LanguageProvider>
        <PaybackModal open={open} onClose={onClose} userData={MOCK_USER} />
      </LanguageProvider>
    ),
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  mockPay.mockClear();
  mockPay.mockResolvedValue({});
});

afterEach(async () => {
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

// ── Tests ─────────────────────────────────────────────────────────────
describe('PaybackModal', () => {
  it('renders correctly with user data', () => {
    renderModal();
    expect(screen.getByText('Pay back amount')).toBeInTheDocument();
    expect(screen.getByText('Test Student')).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes('3,000'))).toBeInTheDocument();
    expect(screen.getByText('¥100')).toBeInTheDocument();
    expect(screen.getByText('¥200')).toBeInTheDocument();
    expect(screen.getByText('¥500')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    renderModal(false);
    expect(screen.queryByText('Test Student')).not.toBeInTheDocument();
  });

  it('shows processing state immediately after preset click', async () => {
    // Keep pay pending so we can observe the processing state
    mockPay.mockReturnValue(new Promise(() => {}));
    renderModal();
    fireEvent.click(screen.getByText('¥100'));
    await waitFor(() =>
      expect(screen.getByText('Payment processing...')).toBeInTheDocument()
    );
  });

  it('calls pay with the correct amount for a preset button', async () => {
    renderModal();
    fireEvent.click(screen.getByText('¥200'));
    await waitFor(() =>
      expect(mockPay).toHaveBeenCalledWith({
        student_id: 12345,
        amount_paid: 200,
      })
    );
  });

  it('shows success state after pay resolves', async () => {
    renderModal();
    fireEvent.click(screen.getByText('¥500'));
    await waitFor(() =>
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument()
    );
  });

  it('auto-closes 2 seconds after payment success', async () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByText('¥100'));
    await waitFor(() => screen.getByText('Payment Successful!'));
    act(() => {
      jest.advanceTimersByTime(2001);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error alert when pay rejects', async () => {
    mockPay.mockRejectedValue(new Error('Network error'));
    renderModal();
    fireEvent.click(screen.getByText('¥100'));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('dismisses the error alert via its close button', async () => {
    mockPay.mockRejectedValue(new Error('fail'));
    renderModal();
    fireEvent.click(screen.getByText('¥100'));
    await waitFor(() => screen.getByRole('alert'));
    // MUI Alert renders a close button with title "Close"
    fireEvent.click(screen.getByTitle('Close'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('opens the custom-amount input after clicking "Other Amount"', () => {
    renderModal();
    fireEvent.click(screen.getByText('Other Amount'));
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
  });

  it('allows entering and submitting a custom amount', async () => {
    renderModal();
    fireEvent.click(screen.getByText('Other Amount'));
    fireEvent.change(screen.getByPlaceholderText('Enter amount'), {
      target: { value: '1500' },
    });
    fireEvent.click(screen.getByText('Confirm Payment'));
    await waitFor(() =>
      expect(mockPay).toHaveBeenCalledWith({
        student_id: 12345,
        amount_paid: 1500,
      })
    );
  });

  it('does not call pay when custom amount is empty', () => {
    renderModal();
    fireEvent.click(screen.getByText('Other Amount'));
    fireEvent.click(screen.getByText('Confirm Payment'));
    expect(mockPay).not.toHaveBeenCalled();
  });

  it('returns to preset view when "Back to presets" is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Other Amount'));
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back to presets'));
    expect(screen.getByText('¥100')).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Enter amount')
    ).not.toBeInTheDocument();
  });

  it('close button calls onClose in idle state', () => {
    const { onClose } = renderModal();
    // The only aria-label-less IconButton is the X close button; find by disabled=false
    const allButtons = screen.getAllByRole('button');
    // Close button is the one that is NOT a preset (¥) and NOT 'Other Amount'
    const closeBtn = allButtons.find(
      (b) => !b.textContent?.match(/¥|Other|Back|Confirm/)
    );
    fireEvent.click(closeBtn!);
    expect(onClose).toHaveBeenCalled();
  });

  it('close button is disabled while processing', async () => {
    mockPay.mockReturnValue(new Promise(() => {}));
    renderModal();
    fireEvent.click(screen.getByText('¥100'));
    await waitFor(() => screen.getByText('Payment processing...'));
    const allButtons = screen.getAllByRole('button');
    const disabledBtn = allButtons.find((b) => b.hasAttribute('disabled'));
    expect(disabledBtn).toBeDefined();
  });
});
