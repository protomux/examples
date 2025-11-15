import { ProtomuxClient } from '@protomux/client';
import WebSocket from 'ws';

const TYPE_STATUS = 'status';
const TYPE_ADMIN = 'admin.echo';

async function run() {
  const token = process.env.JWT_TOKEN;
  if (!token) {
    console.error('Set JWT_TOKEN env var with a valid signed token (HS256 dev-secret-change)');
    process.exit(1);
  }

  // No auth
  const client = new ProtomuxClient('ws://localhost:3000/ws');
  try {
    const empty = new Uint8Array();
    const res = await client.sendRaw(TYPE_STATUS, empty);
    console.log('status response:', new TextDecoder().decode(res));
  } catch (e) {
    console.error('status error', e);
  }
  client.close();

  // With auth
  const clientWithAuth = new ProtomuxClient('ws://localhost:3000/ws', {
    WebSocketImpl: WebSocket as any, // for headers support in Node.js
    headers: { Authorization: `Bearer ${token}` },
    openTimeoutMs: 5000
  });
  try {
    const msg = new TextEncoder().encode('hello admin');
    const res = await clientWithAuth.sendRaw(TYPE_ADMIN, msg);
    console.log('admin response:', new TextDecoder().decode(res));
  } catch (e) {
    console.error('admin error', e);
  }
  clientWithAuth.close();
}

run().catch(err => console.error(err));
