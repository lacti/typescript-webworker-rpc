import { AbstractRPC } from './abstract';
import {
  RPCChannel,
  RPCMessageEvent,
  RPCRawRequest,
  RPCRawResponse,
} from './types';
import { AnyFunction, AType, RType } from './utils/type';

interface RPCHandlerRType<F extends AnyFunction> {
  result: RType<F>;
  transfer?: Transferable[];
}

type RPCHandler<F extends AnyFunction> = (
  args: AType<F>,
) => RPCHandlerRType<F> | Promise<RPCHandlerRType<F>> | void;

interface RPCHandlerOptions {
  noReturn?: boolean;
}

interface RPCHandlerTuple<F extends AnyFunction> {
  handler: RPCHandler<F>;
  options?: RPCHandlerOptions;
}

export class RPCServer<
  RPCMethod extends string,
  RPC extends { [K in RPCMethod]: AnyFunction }
> extends AbstractRPC {
  private readonly handlers: {
    [method: string]: RPCHandlerTuple<any>;
  } = {};

  constructor(channel: RPCChannel) {
    super(channel);
    this.channel.addEventListener('message', this.onMessage);
  }

  public on = <M extends RPCMethod>(
    method: M,
    handler: RPCHandler<RPC[M]>,
    options?: RPCHandlerOptions,
  ) => {
    this.handlers[method] = {
      handler,
      options,
    };
    return this;
  };

  private onMessage = (message: MessageEvent | RPCMessageEvent) => {
    const request: RPCRawRequest = message.data;
    // Channel can be used as duplex.
    if (!request.type) {
      return;
    }
    const tuple = this.handlers[request.type];
    if (!tuple) {
      return this.fireError(new Error(`No handler for ${request.type}`));
    }
    // Can be async.
    this.executeHandler(tuple, request);
  };

  private executeHandler = async (
    tuple: RPCHandlerTuple<any>,
    request: RPCRawRequest,
  ) => {
    const { handler, options } = tuple;
    const response: RPCRawResponse = { id: request.id };

    let transfer: Transferable[] | undefined;
    try {
      let result = handler(request.args);
      if (options && options.noReturn) {
        return;
      }
      if (result && result instanceof Promise) {
        result = await result;
      }
      response.result = result ? result.result : undefined;
      transfer = result ? result.transfer : undefined;
    } catch (error) {
      response.error = error;
    }
    try {
      this.channel.postMessage(response, transfer);
    } catch (error) {
      this.fireError(new Error(error.message));
    }
  };
}
