import { AbstractRPC } from './abstract';
import {
  RPCChannel,
  RPCMessageEvent,
  RPCRawRequest,
  RPCRawResponse,
} from './types';
import { AnyFunction, PostMethodCondition, PromiseOrValue, RPCDeclaration } from './utils/type';

type RPCHandlerRType<F extends AnyFunction> = ReturnType<F> extends void ? (void | { result?: never, transfer: Transferable[] }) : {
  result: ReturnType<F>;
  transfer?: Transferable[];
};

type RPCHandler<F extends AnyFunction> = (
  ...args: Parameters<F>
) => PromiseOrValue<PostMethodCondition<F, void, RPCHandlerRType<F>>>;

interface PostRPCHandlerOptions {
  noReturn: true;
}

type CallRPCHandlerOptions = null;

type RPCHandlerOptions<F extends AnyFunction> = PostMethodCondition<F, PostRPCHandlerOptions, CallRPCHandlerOptions>;

interface RPCHandlerTuple<F extends AnyFunction> {
  handler: RPCHandler<F>;
  options: RPCHandlerOptions<F>;
}

export class RPCServer<
  RPC extends RPCDeclaration<RPC>
  > extends AbstractRPC {
  private readonly handlers: {
    [method in keyof RPC]: RPCHandlerTuple<any>;
  } = {} as any;

  constructor(channel: RPCChannel) {
    super(channel);
    this.channel.addEventListener('message', this.onMessage);
  }

  public on = <M extends keyof RPC>(
    method: M,
    handler: RPCHandler<RPC[M]>,
    options: RPCHandlerOptions<RPC[M]>,
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
    const tuple = this.handlers[request.type as keyof RPC];
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
      let result = handler(...request.args);
      if (options && options.noReturn) {
        return;
      }
      if (result && result instanceof Promise) {
        result = await result;
      }
      if (result) {
        response.result = result.result;
        transfer = result.transfer;
      }
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
