import { renderHook } from '@testing-library/react';
import { fetcher } from '../useUsers';
import React from 'react';
import { LanguageProvider } from '../../context/LanguageContext';

// ── Mock SWR ─────────────────────────────────────────────────────────
const mockUseSWR = jest.fn();
jest.mock('swr', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseSWR(...args),
}));

// ── Import after mocks ────────────────────────────────────────────────
import { useUsers } from '../useUsers';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(LanguageProvider, null, children);

describe('useUsers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns users when SWR resolves', () => {
    const fakeUsers = [
      {
        student_id: 1,
        first_name: 'Alice',
        last_name: 'Johnson',
        account_balance: 50,
        status: 'active',
      },
    ];
    mockUseSWR.mockReturnValue({
      data: { users: fakeUsers },
      error: undefined,
      isLoading: false,
    });

    // useUsers calls useSWR with the full URL and the fetcher
    mockUseSWR.mockReturnValue({
      data: fakeUsers,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useUsers(), { wrapper });
    expect(result.current.users).toEqual(fakeUsers);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns empty array and loading=true while fetching', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useUsers(), { wrapper });
    expect(result.current.users).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('returns a localised error message on fetch failure', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error('Network error'),
      isLoading: false,
    });

    const { result } = renderHook(() => useUsers(), { wrapper });
    expect(result.current.users).toEqual([]);
    expect(result.current.loading).toBe(false);
    // The hook turns the raw error into the translation string
    expect(typeof result.current.error).toBe('string');
    expect(result.current.error!.length).toBeGreaterThan(0);
  });

  it('returns empty array when data is undefined (no error yet)', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useUsers(), { wrapper });
    expect(result.current.users).toEqual([]);
  });
});

// ── Direct fetcher() tests (mocked fetch) ─────────────────────────────
// These exercise branches that SWR never reaches when the module is mocked.
describe('fetcher (useUsers)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns the users array on a successful response', async () => {
    const users = [
      {
        student_id: 1,
        first_name: 'A',
        last_name: 'B',
        account_balance: 0,
        status: 'active',
      },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ users }),
    } as Response);

    const result = await fetcher('http://test/users/');
    expect(result).toEqual(users);
  });

  it('falls back to [] when response body has no .users field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}), // missing .users
    } as Response);

    const result = await fetcher('http://test/users/');
    expect(result).toEqual([]);
  });

  it('throws when response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    await expect(fetcher('http://test/users/')).rejects.toThrow(
      'Failed to fetch users: 503'
    );
  });
});
