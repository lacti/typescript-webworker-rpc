export type AnyFunction = (...args: any[]) => any;

export type PromiseOrValue<V> = Promise<V> | V;

export type RPCDeclaration<RPC> = { [K in keyof RPC]: AnyFunction };

export interface PostReturn {
  __post__: never;
}

export type PostMethodCondition<FN extends AnyFunction, T, F> = ReturnType<FN> extends void ? F : (ReturnType<FN> extends PostReturn ? T : F);

export type CallMethodNames<
  T extends { [K: string]: AnyFunction }
  > = {
    [K in keyof T]: PostMethodCondition<T[K], never, K>
  }[keyof T];

export type PostMethodNames<T extends { [K: string]: AnyFunction }> = Exclude<keyof T, CallMethodNames<T>>;
