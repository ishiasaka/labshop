import { renderHook } from '@testing-library/react';
import { postPayment } from '../usePayment';

// ── Mock swr/mutation ─────────────────────────────────────────────────
const mockUseSWRMutation = jest.fn();
jest.mock('swr/mutation', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseSWRMutation(...args),
}));

// ── Import after mocks ────────────────────────────────────────────────
import { usePayment } from '../usePayment';

describe('usePayment', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns pay function and initial idle state', () => {
    const triggerMock = jest.fn();
    mockUseSWRMutation.mockReturnValue({
      trigger: triggerMock,
      isMutating: false,
      error: undefined,
    });

    const { result } = renderHook(() => usePayment());

    expect(typeof result.current.pay).toBe('function');
    expect(result.current.isPaying).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('reflects isPaying=true while mutating', () => {
    const triggerMock = jest.fn();
    mockUseSWRMutation.mockReturnValue({
      trigger: triggerMock,
      isMutating: true,
      error: undefined,
    });

    const { result } = renderHook(() => usePayment());

    expect(result.current.isPaying).toBe(true);
  });

  it('converts an Error instance to its message string', () => {
    mockUseSWRMutation.mockReturnValue({
      trigger: jest.fn(),
      isMutating: false,
      error: new Error('Payment failed: 422'),
    });

    const { result } = renderHook(() => usePayment());

    expect(result.current.error).toBe('Payment failed: 422');
  });

  it('converts a non-Error truthy error to a string', () => {
    mockUseSWRMutation.mockReturnValue({
      trigger: jest.fn(),
      isMutating: false,
      error: { detail: 'bad request' },
    });

    const { result } = renderHook(() => usePayment());

    // non-Error objects → String(error)
    expect(typeof result.current.error).toBe('string');
    expect(result.current.error!.length).toBeGreaterThan(0);
  });

  it('calls useSWRMutation with the payments endpoint', () => {
    mockUseSWRMutation.mockReturnValue({
      trigger: jest.fn(),
      isMutating: false,
      error: undefined,
    });
    renderHook(() => usePayment());

    const [[url]] = mockUseSWRMutation.mock.calls;
    expect(url).toMatch(/\/payments\//);
  });
});

// ── Direct postPayment() tests (mocked fetch) ─────────────────────────
// These exercise the fetcher branches that useSWRMutation mocking bypasses.
describe('postPayment (usePayment)', () => {
  const ARG = { student_id: 1, amount_paid: 100 };
  const PAYMENT_OUT = {
    student_id: 1,
    amount_paid: 100,
    external_transaction_id: 'ext-1',
    idempotency_key: 'key-1',
    id: 'pay-1',
    status: 'completed',
    created_at: '2026-01-01T00:00:00Z',
  };

  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns the payment on a successful response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => PAYMENT_OUT,
    } as Response);

    const result = await postPayment('http://test/payments/', { arg: ARG });
    expect(result).toEqual(PAYMENT_OUT);
  });

  it('throws with detail message when response is not ok and body has detail', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Insufficient balance' }),
    } as Response);

    await expect(
      postPayment('http://test/payments/', { arg: ARG })
    ).rejects.toThrow('Insufficient balance');
  });

  it('throws with generic message when error body has no detail field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    await expect(
      postPayment('http://test/payments/', { arg: ARG })
    ).rejects.toThrow('Payment failed: 500');
  });

  it('throws with generic message when error body JSON cannot be parsed (.catch branch)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => {
        throw new SyntaxError('bad json');
      },
    } as Response);

    await expect(
      postPayment('http://test/payments/', { arg: ARG })
    ).rejects.toThrow('Payment failed: 503');
  });
});
