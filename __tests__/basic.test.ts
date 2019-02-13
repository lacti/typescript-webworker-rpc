import * as rpc from '../src';
import { createChannels } from './utils/channel';

interface AccumulatorRPC {
  addPost: (value: number) => rpc.PostReturn;
  addSync: (value: number) => void;
  addAndGet: (value: number) => number;
  get: () => number;
}

class AccumulatorClient extends rpc.RPCClient<
  AccumulatorRPC
  > { }
class AccumulatorServer extends rpc.RPCServer<
  AccumulatorRPC
  > { }

test('basic', async () => {
  const { windowChannel, workerChannel } = createChannels();
  const windowRPC = new AccumulatorClient(windowChannel);

  let workerValue = 0;
  new AccumulatorServer(workerChannel)
    .on(
      'addPost',
      value => {
        workerValue += value;
      },
      { noReturn: true },
    )
    .on('addSync', value => {
      workerValue += value;
    }, null)
    .on('addAndGet', value => ({ result: workerValue += value }), null)
    .on('get', () => ({ result: workerValue }), null)
    .onError(console.error);

  expect(await windowRPC.call('get')).toEqual(0);

  windowRPC.post('addPost', 10);
  expect(await windowRPC.call('get')).toEqual(10);

  await windowRPC.call('addSync', 20);
  expect(await windowRPC.call('get')).toEqual(30);

  expect(await windowRPC.call('addAndGet', 30)).toEqual(60);
  expect(await windowRPC.call('get')).toEqual(60);
});
