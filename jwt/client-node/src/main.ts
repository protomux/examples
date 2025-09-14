import { ProtomuxClient, encodeEnvelope } from '@protomux/client';
import WebSocket from 'ws';
// @ts-ignore ambient fallback if not yet typed
declare const process: any;
// status handler expects raw bytes; we send empty payload
const TYPE_STATUS = 'status';

async function run() {
  const token = process.env.JWT_TOKEN;
  if (!token) {
    console.error('Set JWT_TOKEN env var with a valid signed token (HS256 dev-secret-change)');
    process.exit(1);
  }

  console.log('connecting to server with explicit ws implementation...');
  const client = new ProtomuxClient('ws://localhost:3000/ws', {
    WebSocketImpl: WebSocket, // ensures headers supported in Node
    headers: { Authorization: `Bearer ${token}` },
    onOpen: () => console.log('websocket open'),
    openTimeoutMs: 5000
  });
  const empty = new Uint8Array();
  let res: Uint8Array;
  try {
    res = await client.request(TYPE_STATUS, empty);
  } catch (e) {
    console.error('status error', e);
    client.close();
    return;
  }
  console.log('status response:', new TextDecoder().decode(res));

  client.close();
}

run().catch(err => console.error(err));
