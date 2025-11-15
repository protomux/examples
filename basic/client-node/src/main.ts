import { ProtomuxClient, ProtomuxError } from "@protomux/client";
import {
  ListBooksRequest,
  ListBooksResponse,
  CreateBookRequest,
  CreateBookResponse,
} from "./gen/proto/book_service";

async function run() {
  const client = new ProtomuxClient("ws://localhost:3000/ws");

  // List books
  try {
    const listRes = await client.send(
      "examples.book.ListBooksRequest",
      {},
      ListBooksRequest,
      ListBooksResponse
    );
    console.log("books:", listRes.books);
  } catch (e: unknown) {
    handleError("List books", e);
  }

  // Create book
  try {
    const createRes = await client.send(
      "examples.book.CreateBookRequest",
      { title: "TS Client Book" },
      CreateBookRequest,
      CreateBookResponse
    );
    console.log("created:", createRes.book);
  } catch (e: unknown) {
    handleError("Create book", e);
  }

  client.close();
}

function handleError(operation: string, error: unknown) {
  if (error instanceof ProtomuxError) {
    console.error(`${operation} error - code: ${error.code}, details: ${error.details}`, error);
  } else {
    console.error(`${operation} error:`, error);
  }
}

run().catch((err) => console.error(err));
