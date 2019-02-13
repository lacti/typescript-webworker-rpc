export type AnyFunction = (...args: any[]) => any;

export type PromiseOrValue<V> = Promise<V> | V;

export type RPCDeclaration<RPC> = { [K in keyof RPC]: AnyFunction };
