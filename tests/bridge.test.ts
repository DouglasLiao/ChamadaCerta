import { afterEach, describe, expect, it, vi } from 'vitest';
import { AndroidBridge, type NativePort } from '../src/platform/android/bridge';
afterEach(() => vi.useRealTimers());
describe('Native request correlation', () => {
  it('correlates concurrent replies even when they arrive out of order', async () => {
    const requests: { id: string }[] = [];
    const port: NativePort = { postMessage: (raw) => requests.push(JSON.parse(raw)) };
    const bridge = new AndroidBridge(() => port);
    const status = bridge.request('status');
    const contacts = bridge.request('contacts');
    port.onmessage?.({ data: JSON.stringify({ id: requests[1].id, result: { items: [] } }) });
    port.onmessage?.({ data: JSON.stringify({ id: requests[0].id, result: { canDial: true } }) });
    await expect(contacts).resolves.toEqual({ items: [] });
    await expect(status).resolves.toEqual({ canDial: true });
  });
  it('ignores malformed messages and unrelated reply ids', async () => {
    let requestId = '';
    const port: NativePort = {
      postMessage: (raw) => {
        requestId = JSON.parse(raw).id;
      },
    };
    const request = new AndroidBridge(() => port).request('status');
    port.onmessage?.({ data: 'invalid' });
    port.onmessage?.({ data: 'null' });
    port.onmessage?.({ data: JSON.stringify({ id: 'unrelated', error: 'ignore' }) });
    port.onmessage?.({ data: JSON.stringify({ id: requestId, result: { canDial: false } }) });
    await expect(request).resolves.toEqual({ canDial: false });
  });
  it('cleans up rejected transport requests', async () => {
    const bridge = new AndroidBridge(() => ({
      postMessage() {
        throw new Error('closed');
      },
    }));
    await expect(bridge.request('status')).rejects.toThrow('Não foi possível acessar');
  });
  it('does not let a late response revive a timed out request', async () => {
    vi.useFakeTimers();
    let requestId = '';
    const port: NativePort = {
      postMessage: (raw) => {
        requestId = JSON.parse(raw).id;
      },
    };
    const request = new AndroidBridge(() => port).request('status');
    const assertion = expect(request).rejects.toThrow('não respondeu');
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;
    expect(() =>
      port.onmessage?.({ data: JSON.stringify({ id: requestId, result: {} }) }),
    ).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });
});
