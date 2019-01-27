import { AnyFunction, AType } from './utils/type';

export interface RpcInterface {
  [name: string]: AnyFunction;
}

export interface RpcRequest<R extends RpcInterface, F extends keyof R> {
  id: number;
  type: F;
  args: AType<R[F]>;
}

export interface RpcRawRequest {
  id: number;
  type: string;
  args: any;
}

export interface RpcRawResponse {
  id: number;
  result?: any;
  error?: Error;
}

export interface CustomMessageEvent {
  data: any;
}

export interface CustomWorker {
  onmessage: ((message: CustomMessageEvent) => void) | null;
  onerror: ((error: ErrorEvent) => void) | null;

  postMessage(message: any, transfer?: Transferable[]): void;
}
