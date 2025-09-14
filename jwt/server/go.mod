module github.com/protomux/examples/jwt/server

go 1.25.1

require github.com/protomux/protomux v0.0.0

require (
	github.com/coder/websocket v1.8.14 // indirect
	github.com/golang-jwt/jwt/v5 v5.3.0 // indirect
	github.com/google/go-cmp v0.7.0 // indirect
	google.golang.org/protobuf v1.36.9 // indirect
)

replace github.com/protomux/protomux => ../../../protomux
