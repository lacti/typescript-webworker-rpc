import { CustomWorker } from './types';

type ErrorHandler = (error: Error | ErrorEvent) => void;

export class AbstractRpc {
  private errorHandler?: ErrorHandler | null = null;

  public constructor(protected readonly worker: Worker | CustomWorker) {
    this.worker.onerror = this.fireError;
  }

  public onError = (handler: ErrorHandler) => {
    this.errorHandler = handler;
    return this;
  };

  protected fireError = (error: Error | ErrorEvent) => {
    if (this.errorHandler) {
      this.errorHandler(error);
    }
  };
}
