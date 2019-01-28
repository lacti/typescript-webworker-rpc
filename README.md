# TypeScript WebWorker RPC [![Build Status](https://travis-ci.org/lacti/typescript-webworker-rpc.svg?branch=master)](https://travis-ci.org/lacti/typescript-webworker-rpc)

This is a simple RPC utils to build a bridge between `window` and `worker` as simple way using TypeScript.

## Install

```bash
yarn add typescript-webworker-rpc
```

## Quick start

1. Define your RPC interface.

```typescript
interface AccumulatorRpc {
  add: (value: number) => void;
  get: () => number;
}
```

2. Create an object for worker-side and register handlers.

```typescript
let totalValue = 0;
new WorkerSide<keyof AccumulatorRpc, AccumulatorRpc>(self as any)
  .on('add', value => {
    totalValue += value;
  })
  .on('get', () => ({ result: totalValue }));
```

3. Create an object for window-side.

```typescript
const rpc = new WindowSide<keyof AccumulatorRpc, AccumulatorRpc>(worker);

await rpc.call('add', 20);
const newValue = await rpc.call('get', {});
```

## API

### `WindowSide`

A object to call a method to send a request to web-worker side and wait a result using `Promise`.

#### `call`

```typescript
await rpc.call(`method-name`, parameter, transfer?);
```

If you send an `ArrayBuffer` to web-worker, you can use like this. If you can transfer an ownership of that object, please use `transfer` parameter like `postMessage`.

```typescript
await rpc.call(`addBuffer`, buffer, [buffer]);
```

If you want to send multiple parameters, please use an object like this.

```typescript
interface ComplexCall {
  awesome: (args: { some: number; thing: string }) => void;
}
await rpc.call(`awesome`, { some: 10, thing: 'good' });
```

#### `post`

`call` method uses a `promise` to wait its result from web-worker. But if you want to post a message and don't need to wait for its result, you can use `post` method like this.

```typescript
rpc.post(`addBuffer`, buffer, [buffer]);
```

It can reduce meaningless waiting costs when you can fire and forget.

#### `onError`

If you want to handle an error from `worker`, please chain `error` handler using `onError` method.

```typescript
rpc.onError(error => console.error);
```

### `WorkerSide`

A object to receive a request from window and response a result.

#### `on` (for `call`)

You can write a method call handler like event handler.

```typescript
rpc.on(`method-name`, `handler => {result, transfer}`, `transfer`);
```

If your method is a void function, you can write a void handler. But in other cases, a return type should be `{result: ReturnType; transfer?: Transferable[] }` because it should support `transfer` like `postMessage`.

#### `on` (for `post`)

If your handler doesn't need to response due to call from `post` function, you should use `noReturn` option when installing a method handler.

```typescript
rpc.on(
  `addBuffer`,
  buffer => {
    buffers.push(buffer);
  },
  { noReturn: true },
);
```

Then there is no `postMessage` for that.

#### `onError`

It is same as `WindowSide#onError`.
If you want to handle an error from `worker`, please chain `error` handler using `onError` method.

```typescript
rpc.onError(error => console.error);
```

## Limitation

I'm a newbie in TypeScript world, so I want to enhance some of functionalities but I have to study more.

1. Type parameters in `WindowSide` and `WorkerSide` should be merged as one parameter. Now, it should be written as `WindowSide<keyof RPC, RPC>` to specify a list of methods with type-safety but I don't know how to use like `WindowSide<RPC>` with same constraints.
2. I don't know how to support multi-parameters naturally while calling a function.
3. I don't know how to omit a parameter if a method doesn't have any parameters.
4. I don't know how to build type-safety between `on (for call)` and `on (for post)` in worker-side.

## License

MIT
