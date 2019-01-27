import { CustomWorker } from '../../src/types';

export const createWorkers = () => {
  const workerWorker: CustomWorker = {
    onerror: null,
    onmessage: null,
    postMessage(data: any) {
      windowWorker.onmessage!({
        data,
      });
    },
  };
  const windowWorker: CustomWorker = {
    onerror: null,
    onmessage: null,
    postMessage(data: any) {
      workerWorker.onmessage!({
        data,
      });
    },
  };
  return { workerWorker, windowWorker };
};
