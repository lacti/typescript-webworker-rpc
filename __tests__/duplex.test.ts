import * as rpc from '../src';
import { createChannels } from './utils/channel';

interface Ping {
  ping: (remainCount: number) => number;
}

interface Pong {
  pong: (remainCount: number) => number;
}

test('duplex', async () => {
  const { windowChannel, workerChannel } = createChannels();
  const pingRPC = new rpc.RPCClient<Ping>(windowChannel);
  new rpc.RPCServer<Ping>(workerChannel).on(
    'ping',
    async remainCount => {
      console.log('ping', remainCount);
      expect(remainCount % 2).toEqual(0);

      let result = 0;
      if (remainCount > 0) {
        result = await pongRPC.call('pong', remainCount - 1);
      }
      expect(result).toEqual(0);
      return { result };
    }, null,
  );

  const pongRPC = new rpc.RPCClient<Pong>(workerChannel);
  new rpc.RPCServer<Pong>(windowChannel).on(
    'pong',
    async remainCount => {
      console.log('pong', remainCount);
      expect(remainCount % 2).toEqual(1);

      let result = 0;
      if (remainCount > 0) {
        result = await pingRPC.call('ping', remainCount - 1);
      }
      expect(result).toEqual(0);
      return { result };
    }, null,
  );

  await pingRPC.call('ping', 10);
});
