import { AbstractRPC } from './abstract';
import {
  RPCChannel,
  RPCMessageEvent,
  RPCRawResponse,
  RPCRequest,
} from './types';
import { ValueResolver } from './utils/promise';
import { CallMethodNames, PostMethodNames, RPCDeclaration } from './utils/type';

const InternalCall = Symbol('RPCClient internal call');
const InternalPost = Symbol('RPCClient internal post');

export class RPCWithTransfer<RPC extends RPCDeclaration<RPC>> {
  public constructor(private client: RPCClient<RPC>, private transfers?: Transferable[]) {
  }

  public call: RPCClient<RPC>['call'] = (
    method,
    ...args
  ) => {
    return this.client[InternalCall](method, this.transfers, ...args);
  }

  public post: RPCClient<RPC>['post'] = (
    method,
    ...args
  ) => {
    this.client[InternalPost](method, this.transfers, ...args);
  }
}

export class RPCClient<
  RPC extends RPCDeclaration<RPC>
  > extends AbstractRPC {
  private idSerial = 0;
  private resolvers: { [id: number]: ValueResolver<any> } = {};

  public constructor(worker: RPCChannel) {
    super(worker);
    this.channel.addEventListener('message', this.onMessage);
  }

  public withTransfer(...transfers: Transferable[]) {
    return new RPCWithTransfer<RPC>(this, transfers);
  }

  public call = <M extends CallMethodNames<RPC>>(
    method: M,
    ...args: Parameters<RPC[M]>
  ) => {
    return this[InternalCall](method, undefined, ...args);
  };

  public [InternalCall] = <M extends CallMethodNames<RPC>>(
    method: M,
    transfer: Transferable[] | undefined,
    ...args: Parameters<RPC[M]>
  ) => {
    const request: RPCRequest<RPC, M> = {
      id: this.idSerial++,
      type: method,
      args
    };
    const holder = new ValueResolver<ReturnType<RPC[M]>>();
    this.resolvers[request.id] = holder;
    return holder.promise(() => {
      this.channel.postMessage(request, transfer);
    });
  };

  public post = <M extends PostMethodNames<RPC>>(
    method: M,
    ...args: Parameters<RPC[M]>
  ) => {
    this[InternalPost](method, undefined, ...args);
  };

  public [InternalPost] = <M extends PostMethodNames<RPC>>(
    method: M,
    transfer: Transferable[] | undefined,
    ...args: Parameters<RPC[M]>
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
      return this.fireError(new Error(`No resolver for ${response.id}`));
    }
    try {
      if (response.error) {
        return resolver.reject(response.error);
      } else {
        return resolver.resolve(response.result);
      }
    } catch (error) {
      return this.fireError(new Error(error.message));
    }
  };
}
