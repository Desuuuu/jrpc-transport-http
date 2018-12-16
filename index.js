'use strict';

/**
 * @external EventEmitter
 * @see {@link https://nodejs.org/api/events.html#events_class_eventemitter}
 */

const got = require('got');
const check = require('check-types');
const EventEmitter = require('events');

let _data = new WeakMap();

/**
 * Transport class exported by the module.
 *
 * It sends data to a JSON-RPC server over HTTP(s) using {@link https://github.com/sindresorhus/got|`got`}.
 *
 * @class HTTPTransport
 * @extends EventEmitter
 *
 * @example
 * const HTTPTransport = require('@desuuuu/jrpc-transport-http');
 */
class HTTPTransport extends EventEmitter {

  /**
   * Initialize a new transport instance.
   *
   * @param {Object} options - Transport options.
   * @param {String} options.url - Server URL.
   * @param {String} [options.username] - Basic authentication username.
   * @param {String} [options.password] - Basic authentication password.
   * @param {Object} [options.extra] - Extra options to pass to `got.extend`. {@link https://github.com/sindresorhus/got#goturl-options|Available options}.
   *
   * @emits HTTPTransport#data
   *
   * @throws {TypeError} Invalid parameter.
   *
   * @example
   * let transport = new HTTPTransport({
   *   url: 'http://example.com'
   * });
   */
  constructor({ url, username, password, extra }) {
    super();

    check.assert.nonEmptyString(url, 'missing/invalid "url" option');
    check.assert.maybe.string(username, 'invalid "username" option');
    check.assert.maybe.string(password, 'invalid "password" option');
    check.assert.maybe.object(extra, 'invalid "extra" option');

    extra = extra || {};
    extra.baseUrl = url;
    extra.headers = extra.headers || {};
    extra.json = true;

    if (username && password) {
      extra.headers['Authorization'] = 'Basic ' + Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
    }

    let client = got.extend(Object.assign({
      timeout: 60000
    }, extra));

    _data.set(this, {
      client
    });
  }

  /**
   * Whether the transport needs to be connected before sending/receiving data.
   *
   * @constant {Boolean}
   * @default false
   */
  get needsConnection() {
    return false;
  }

  /**
   * Send data to the server.
   *
   * @param {String} data - Stringified JSON data to send.
   *
   * @promise {Promise} Resolves after the data has been sent.
   * @reject {GotError https://github.com/sindresorhus/got#errors} Error with the request.
   * @reject {TypeError https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError} Invalid parameter.
   */
  async send(data) {
    check.assert.nonEmptyString(data, 'missing/invalid "data" parameter');

    /* We receive a String from jrpc-client but got expects an Object. */
    data = JSON.parse(data);

    let { client } = _data.get(this);

    let response = await client.post('/', {
      body: data
    });

    if (response && response.body) {
      setImmediate(this.emit.bind(this, 'data', response.body));
    }
  }

}

/**
 * Fired when data is received from the server.
 *
 * @event HTTPTransport#data
 * @param {Object} data - Data received.
 */

module.exports = HTTPTransport;
