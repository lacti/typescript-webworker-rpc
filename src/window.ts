import { AbstractRpc } from './abstract';
import {
  CustomMessageEvent,
  CustomWorker,
  RpcRawResponse,
  RpcRequest,
} from './types';
import { ValueResolver } from './utils/promise';
import { AnyFunction, AType, RType } from './utils/type';

export class WindowSide<
  RpcMethod extends string,
  Rpc extends { [K in RpcMethod]: AnyFunction }
> extends AbstractRpc {
  private rpcSerial = 0;
  private resolvers: { [id: number]: ValueResolver<any> } = {};

  public constructor(worker: Worker | CustomWorker) {
    super(worker);
    this.worker.onmessage = this.onMessage;
  }

  public call = <M extends RpcMethod>(
    method: M,
    args: AType<Rpc[M]>,
    transfer?: Transferable[],
  ): Promise<RType<Rpc[M]>> => {
    const request: RpcRequest<Rpc, M> = {
      id: this.rpcSerial++,
      type: method,
      args,
    };
    const holder = new ValueResolver<RType<Rpc[M]>>();
    this.resolvers[request.id] = holder;
    return holder.promise(() => {
      this.worker.postMessage(request, transfer);
    });
  };

  public post = <M extends RpcMethod>(
    method: M,
    args: AType<Rpc[M]>,
    transfer?: Transferable[],
  ) => {
    const request: RpcRequest<Rpc, M> = {
      id: this.rpcSerial++,
      type: method,
      args,
    };
    this.worker.postMessage(request, transfer);
  };

  private onMessage = (message: MessageEvent | CustomMessageEvent) => {
    const response: RpcRawResponse = message.data;
    const resolver = this.resolvers[response.id];
    delete this.resolvers[response.id];
    if (!resolver) {
      return this.fireError(new Error(`No resolver for ${response.id}`));
    }
    try {
      if (response.error) {
        return resolver.reject(response.error);
      } else {
        return resolver.resolve(response.result);
      }
    } catch (error) {
      return this.fireError(error);
    }
  };
}
