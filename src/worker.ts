import { AbstractRpc } from './abstract';
import {
  CustomMessageEvent,
  CustomWorker,
  RpcRawRequest,
  RpcRawResponse,
} from './types';
import { AnyFunction, AType, RType } from './utils/type';

type WorkerRpcHandler<F extends AnyFunction> = (
  args: AType<F>,
) => { result: RType<F>; transfer?: Transferable[] } | void;

interface WorkerRpcHandlerOptions {
  noReturn?: boolean;
}

interface WorkerRpcHandlerTuple<F extends AnyFunction> {
  handler: WorkerRpcHandler<F>;
  options?: WorkerRpcHandlerOptions;
}

export class WorkerSide<
  RpcMethod extends string,
  Rpc extends { [K in RpcMethod]: AnyFunction }
> extends AbstractRpc {
  private readonly handlers: {
    [method: string]: WorkerRpcHandlerTuple<any>;
  } = {};

  constructor(worker: Worker | CustomWorker) {
    super(worker);
    this.worker.onmessage = this.onMessage;
  }

  public on = <M extends RpcMethod>(
    method: M,
    handler: WorkerRpcHandler<Rpc[M]>,
    options?: WorkerRpcHandlerOptions,
  ) => {
    this.handlers[method] = {
      handler,
      options,
    };
    return this;
  };

  private onMessage = (message: MessageEvent | CustomMessageEvent) => {
    const request: RpcRawRequest = message.data;
    const tuple = this.handlers[request.type];
    if (!tuple) {
      return this.fireError(new Error(`No handler for ${request.type}`));
    }
    const { handler, options } = tuple;
    const response: RpcRawResponse = { id: request.id };
    let transfer: Transferable[] | undefined;
    try {
      const result = handler(request.args);
      if (options && options.noReturn) {
        return;
      }
      response.result = result ? result.result : undefined;
      transfer = result ? result.transfer : undefined;
    } catch (error) {
      response.error = error;
    }
    this.worker.postMessage(response, transfer);
  };
}
