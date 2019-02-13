export type AnyFunction = (args: any) => any;

export type AType<F extends AnyFunction> = F extends (args: infer A) => any
  ? A
  : void;

export type RType<F extends AnyFunction> = F extends (args: any) => infer R
  ? (R extends void ? undefined : R)
  : never;

export type RPCDeclaration<RPC> = { [K in keyof RPC]: AnyFunction };
