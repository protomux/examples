package main

import (
	"testing"

	bookpb "examples/basic/generated"

	"github.com/protomux/protomux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/proto"
)

// setupTestApp creates a test app with the same handlers as main
func setupTestApp() *protomux.App {
	db := newMemoryDB()
	app := newServer(db)

	return app
}

func TestListBooksEmpty(t *testing.T) {
	app := setupTestApp()
	client := protomux.NewTestClient(t, app)

	req := &bookpb.ListBooksRequest{}
	resp := &bookpb.ListBooksResponse{}

	err := client.CallProto(req, resp)
	require.NoError(t, err)
	assert.Empty(t, resp.Books)
}

func TestCreateBook(t *testing.T) {
	app := setupTestApp()
	client := protomux.NewTestClient(t, app)

	req := &bookpb.CreateBookRequest{
		Title: "The Go Programming Language",
	}
	resp := &bookpb.CreateBookResponse{}

	err := client.CallProto(req, resp)
	require.NoError(t, err)
	require.NotNil(t, resp.Book)
	assert.Equal(t, int32(1), resp.Book.Id)
	assert.Equal(t, "The Go Programming Language", resp.Book.Title)
}

func TestCreateAndListBooks(t *testing.T) {
	app := setupTestApp()
	client := protomux.NewTestClient(t, app)

	// Create multiple books
	books := []string{
		"Clean Code",
		"Design Patterns",
		"Refactoring",
	}

	for _, title := range books {
		req := &bookpb.CreateBookRequest{Title: title}
		resp := &bookpb.CreateBookResponse{}

		err := client.CallProto(req, resp)
		require.NoError(t, err, "CreateBook failed for '%s'", title)
		require.NotNil(t, resp.Book, "expected book in response for '%s'", title)
		assert.Equal(t, title, resp.Book.Title)
	}

	// List all books
	listReq := &bookpb.ListBooksRequest{}
	listResp := &bookpb.ListBooksResponse{}

	err := client.CallProto(listReq, listResp)
	require.NoError(t, err)
	require.Len(t, listResp.Books, len(books))

	// Verify book titles
	for i, book := range listResp.Books {
		assert.Equal(t, books[i], book.Title, "book %d title mismatch", i)
		assert.Equal(t, int32(i+1), book.Id, "book %d ID mismatch", i)
	}
}

func TestStatusEndpoint(t *testing.T) {
	app := setupTestApp()
	client := protomux.NewTestClient(t, app)

	resp, err := client.Call("status", nil)
	require.NoError(t, err)
	assert.Equal(t, "ok", string(resp.Payload))
}

// Example test demonstrating error handling
func TestErrorHandling(t *testing.T) {
	app := protomux.MockApp()

	// Register a handler that returns an error
	app.RegisterProto(&bookpb.CreateBookRequest{}, &bookpb.CreateBookResponse{},
		func(c *protomux.Ctx, req proto.Message) (proto.Message, error) {
			r := req.(*bookpb.CreateBookRequest)

			// Validate title
			if r.Title == "" {
				c.InvalidArgument("title is required")
				return nil, nil
			}

			// Simulate resource not found
			if r.Title == "not-found" {
				c.NotFound("book not found")
				return nil, nil
			}

			return &bookpb.CreateBookResponse{
				Book: &bookpb.Book{Id: 1, Title: r.Title},
			}, nil
		})

	client := protomux.NewTestClient(t, app)

	t.Run("missing title", func(t *testing.T) {
		req := &bookpb.CreateBookRequest{Title: ""}
		err := client.ExpectError(req, protomux.CodeInvalidArgument)
		assert.Equal(t, "title is required", err.Message)
	})

	t.Run("not found", func(t *testing.T) {
		req := &bookpb.CreateBookRequest{Title: "not-found"}
		err := client.ExpectError(req, protomux.CodeNotFound)
		assert.Equal(t, "book not found", err.Message)
	})

	t.Run("success", func(t *testing.T) {
		req := &bookpb.CreateBookRequest{Title: "Valid Book"}
		resp := &bookpb.CreateBookResponse{}

		err := client.CallProto(req, resp)
		require.NoError(t, err)
		assert.Equal(t, "Valid Book", resp.Book.Title)
	})
}

// Example unit test for handler logic without websocket
func TestHandlerUnit(t *testing.T) {
	ctx := protomux.TestHandler(t)

	// Set some context values
	ctx.SetLocal("user_id", "test-user")

	// Verify context works
	userID, ok := ctx.Local("user_id")
	require.True(t, ok, "expected user_id in locals")
	assert.Equal(t, "test-user", userID)
}
