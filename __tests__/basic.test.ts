import * as rpc from '../src';
import { createWorkers } from './utils/workers';

interface AccumulatorRpc {
  addPost: (value: number) => void;
  addSync: (value: number) => void;
  addAndGet: (value: number) => number;
  get: () => number;
}

class AccumulatorWindowSide extends rpc.WindowSide<
  keyof AccumulatorRpc,
  AccumulatorRpc
> {}
class AccumulatorWorkerSide extends rpc.WorkerSide<
  keyof AccumulatorRpc,
  AccumulatorRpc
> {}

test('basic', async () => {
  const { windowWorker, workerWorker } = createWorkers();
  const windowRpc = new AccumulatorWindowSide(windowWorker);

  let workerValue = 0;
  new AccumulatorWorkerSide(workerWorker)
    .on(
      'addPost',
      value => {
        workerValue += value;
      },
      { noReturn: true },
    )
    .on('addSync', value => {
      workerValue += value;
    })
    .on('addAndGet', value => ({ result: workerValue += value }))
    .on('get', () => ({ result: workerValue }))
    .onError(console.error);

  expect(await windowRpc.call('get', {})).toEqual(0);

  windowRpc.post('addPost', 10);
  expect(await windowRpc.call('get', {})).toEqual(10);

  await windowRpc.call('addSync', 20);
  expect(await windowRpc.call('get', {})).toEqual(30);

  expect(await windowRpc.call('addAndGet', 30)).toEqual(60);
  expect(await windowRpc.call('get', {})).toEqual(60);
});
