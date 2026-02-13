import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';

// ── Mock WebSocket ──────────────────────────────────────────────────
type WSHandler = ((ev: { data: string }) => void) | null;

let mockInstance: {
  onopen: (() => void) | null;
  onmessage: WSHandler;
  onclose: (() => void) | null;
  onerror: ((err: unknown) => void) | null;
  close: jest.Mock;
  readyState: number;
};

class MockWebSocket {
  static readonly OPEN = 1;
  static readonly CONNECTING = 0;
  static readonly CLOSED = 3;

  onopen: (() => void) | null = null;
  onmessage: WSHandler = null;
  onclose: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;
  close = jest.fn();
  readyState = MockWebSocket.CONNECTING;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockInstance = this;
  }
}

beforeAll(() => {
  // @ts-expect-error - mock global
  global.WebSocket = MockWebSocket;
});

afterAll(() => {
  // @ts-expect-error - cleanup
  delete global.WebSocket;
});

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// ── Tests ───────────────────────────────────────────────────────────
describe('useWebSocket', () => {
  it('connects on mount and reports status', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.status).toBe('connecting');

    act(() => {
      mockInstance.readyState = MockWebSocket.OPEN;
      mockInstance.onopen?.();
    });

    expect(result.current.status).toBe('connected');
  });

  it('calls onMessage with parsed JSON', () => {
    const onMessage = jest.fn();
    renderHook(() => useWebSocket({ onMessage }));

    act(() => {
      mockInstance.onopen?.();
    });

    const payload = { name: 'Taro', id: '42', owedAmount: 1500 };
    act(() => {
      mockInstance.onmessage?.({ data: JSON.stringify(payload) });
    });

    expect(onMessage).toHaveBeenCalledWith(payload);
  });

  it('ignores non-JSON messages without crashing', () => {
    const onMessage = jest.fn();
    renderHook(() => useWebSocket({ onMessage }));

    act(() => {
      mockInstance.onopen?.();
    });

    act(() => {
      mockInstance.onmessage?.({ data: '<ECHO> hello' });
    });

    expect(onMessage).not.toHaveBeenCalled();
  });

  it('attempts reconnect after close', () => {
    renderHook(() => useWebSocket({ reconnectDelay: 1000 }));

    act(() => {
      mockInstance.onopen?.();
    });

    const firstInstance = mockInstance;

    act(() => {
      // Simulate the socket being fully closed
      mockInstance.readyState = MockWebSocket.CLOSED;
      mockInstance.onclose?.();
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // A new WebSocket should have been created
    expect(mockInstance).not.toBe(firstInstance);
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    act(() => {
      mockInstance.onopen?.();
    });

    const ws = mockInstance;
    unmount();

    expect(ws.close).toHaveBeenCalled();
  });
});
