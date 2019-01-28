import { AbstractRPC } from './abstract';
import {
  RPCChannel,
  RPCMessageEvent,
  RPCRawResponse,
  RPCRequest,
} from './types';
import { ValueResolver } from './utils/promise';
import { AnyFunction, AType, RType } from './utils/type';

export class RPCClient<
  RPCMethod extends string,
  RPC extends { [K in RPCMethod]: AnyFunction }
> extends AbstractRPC {
  private idSerial = 0;
  private resolvers: { [id: number]: ValueResolver<any> } = {};

  public constructor(worker: RPCChannel) {
    super(worker);
    this.channel.addEventListener('message', this.onMessage);
  }

  public call = <M extends RPCMethod>(
    method: M,
    args: AType<RPC[M]>,
    transfer?: Transferable[],
  ): Promise<RType<RPC[M]>> => {
    const request: RPCRequest<RPC, M> = {
      id: this.idSerial++,
      type: method,
      args,
    };
    const holder = new ValueResolver<RType<RPC[M]>>();
    this.resolvers[request.id] = holder;
    return holder.promise(() => {
      this.channel.postMessage(request, transfer);
    });
  };

  public post = <M extends RPCMethod>(
    method: M,
    args: AType<RPC[M]>,
    transfer?: Transferable[],
  ) => {
    const request: RPCRequest<RPC, M> = {
      id: this.idSerial++,
      type: method,
      args,
    };
    this.channel.postMessage(request, transfer);
  };

  private onMessage = (message: MessageEvent | RPCMessageEvent) => {
    const response: RPCRawResponse = message.data;
    // Channel can be used as duplex.
    if (message.data.type) {
      return;
    }
    const resolver = this.resolvers[response.id];
    delete this.resolvers[response.id];
    if (!resolver) {
      return this.fireError(new ErrorEvent(`No resolver for ${response.id}`));
    }
    try {
      if (response.error) {
        return resolver.reject(response.error);
      } else {
        return resolver.resolve(response.result);
      }
    } catch (error) {
      return this.fireError(new ErrorEvent(error.message));
    }
  };
}
