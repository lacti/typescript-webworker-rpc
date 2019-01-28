import { AnyFunction, AType } from './utils/type';

interface RPCInterface {
  [name: string]: AnyFunction;
}

export interface RPCRequest<R extends RPCInterface, F extends keyof R> {
  id: number;
  type: F;
  args: AType<R[F]>;
}

export interface RPCRawRequest {
  id: number;
  type: string;
  args: any;
}

export interface RPCRawResponse {
  id: number;
  result?: any;
  error?: Error;
}

export interface RPCMessageEvent {
  data: any;
}

interface ChannelEventMap {
  message: RPCMessageEvent;
  error: ErrorEvent;
}

export interface RPCChannel {
  addEventListener<K extends keyof ChannelEventMap>(
    name: K,
    listener: ((event: ChannelEventMap[K]) => void) | null,
  ): void;

  postMessage(message: any, transfer?: Transferable[]): void;
}
