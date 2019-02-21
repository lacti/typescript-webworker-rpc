# TypeScript WebWorker RPC [![Build Status](https://travis-ci.org/lacti/typescript-webworker-rpc.svg?branch=master)](https://travis-ci.org/lacti/typescript-webworker-rpc)

This is a simple RPC utils to build a bridge between `window` and `worker` as simple way using TypeScript.

## Install

```bash
yarn add typescript-webworker-rpc
```

## Usage

### Quick start

1. Define your RPC interface.

```typescript
interface AccumulatorRPC {
  add: (value: number) => void;
  get: () => number;
}
```

2. Create an object for server-calling and register handlers.

```typescript
// Maybe in web-worker context.
let totalValue = 0;
new RPCServer<keyof AccumulatorRPC, AccumulatorRPC>(self as any)
  .on('add', value => {
    totalValue += value;
  })
  .on('get', () => ({ result: totalValue }));
```

3. Create an object for client-calling.

```typescript
// Maybe in window context.
const rpc = new RPCClient<keyof AccumulatorRPC, AccumulatorRPC>(worker);

await rpc.call('add', 20);
const newValue = await rpc.call('get', {});
```

### Advanced

Let's write an example that communicates each endpoints with ping and pong messages.

1. Write two interfaces for that.

```typescript
// window -> worker
interface Ping {
  ping: () => void;
}
// worker -> window
interface Pong {
  pong: () => void;
}
```

2. Write both of client and server using both channels.

```typescript
// window.ts
const pingRPC = new rpc.RPCClient<keyof Ping, Ping>(worker);
new rpc.RPCServer<keyof Pong, Pong>(worker).on('pong', async () => {
  await pingRPC.call('ping', {});
});

// worker.ts
const pongRPC = new rpc.RPCClient<keyof Pong, Pong>(self as any);
new rpc.RPCServer<keyof Ping, Ping>(self as any).on('ping', async () => {
  await pongRPC.call('pong', {});
});
```

Of course, above example doesn't be terminated because it is the infinity recursive call.

## API

### `RPCClient`

A object to call a method to send a request to web-worker side and wait a result using `Promise`.

#### `call`

```typescript
await rpc.call(`method-name`, parameter, transfer?);
```

If you send an `ArrayBuffer` to web-worker, you can use like this. If you can transfer the ownership of that object, please use `transfer` parameter like `postMessage`.

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

### `RPCServer`

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

It is same as `RPCClient#onError`.
If you want to handle an error from `worker`, please chain `error` handler using `onError` method.

```typescript
rpc.onError(error => console.error);
```

## License

MIT
