import { ProtomuxClient, encodeMessage, decodeMessage } from '@protomux/client';
// Import requires .js extension under NodeNext ESM even though source is TS; ts-node maps it automatically.
import { ListBooksRequest, ListBooksResponse, CreateBookRequest, CreateBookResponse } from './gen/proto/book_service.js';

// FQ type names used by server routing
const TYPE_LIST_BOOKS_REQ = 'examples.book.ListBooksRequest';
const TYPE_CREATE_BOOK_REQ = 'examples.book.CreateBookRequest';

async function run() {
  const client = new ProtomuxClient('ws://localhost:3000/ws');

  // List books
  const listReq = encodeMessage({}, ListBooksRequest);
  const listResBytes = await client.request(TYPE_LIST_BOOKS_REQ, listReq).catch(e => { console.error('list error', e); throw e; });
  const listRes = decodeMessage<ListBooksResponse>(listResBytes, ListBooksResponse);
  console.log('books:', listRes.books);

  // Create book
  const createReq = encodeMessage({ title: 'TS Client Book' } as CreateBookRequest, CreateBookRequest);
  const createResBytes = await client.request(TYPE_CREATE_BOOK_REQ, createReq).catch(e => { console.error('create error', e); throw e; });
  const createRes = decodeMessage<CreateBookResponse>(createResBytes, CreateBookResponse);
  console.log('created:', createRes.book);

  client.close();
}

run().catch(err => console.error(err));
