'use strict';

const JRPCClient = require('@desuuu/jrpc-client');
const HTTPTransport = require('@desuuuu/jrpc-transport-http');

(async () => {
  let client = new JRPCClient({
    transport: new HTTPTransport({
      url: 'http://example.com'
    })
  });

  try {
    let result = await client.call('method', [ 'params' ]);

    console.log(result); // The call's result

    //=> ...
  } catch (error) {
    console.error(error); // A transport error or an RPC error
  }

  await client.destroy();
})();
