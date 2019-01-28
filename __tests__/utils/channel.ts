import { RPCChannel, RPCMessageEvent } from '../../src/types';

class Peer<T> {
  private a: T;
  private b: T;

  public setPeer = (a: T, b: T) => {
    this.a = a;
    this.b = b;
  };
  public getPeer = (me: T) => (this.a === me ? this.b : this.a);
}

class MockChannel implements RPCChannel {
  private readonly listeners: Array<(message: RPCMessageEvent) => void> = [];

  public constructor(private readonly peer: Peer<MockChannel>) {}

  public addEventListener(name: 'message' | 'error', handler: any) {
    if (name === 'message') {
      this.listeners.push(handler);
    }
  }

  public fireMessageEvent = (data: any) => {
    for (const listener of this.listeners) {
      listener({ data });
    }
  };

  public postMessage(data: any) {
    this.peer.getPeer(this).fireMessageEvent(data);
  }
}

export const createChannels = () => {
  const peer = new Peer<MockChannel>();
  const workerChannel = new MockChannel(peer);
  const windowChannel = new MockChannel(peer);
  peer.setPeer(workerChannel, windowChannel);
  return { workerChannel, windowChannel };
};
