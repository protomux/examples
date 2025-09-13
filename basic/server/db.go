package main

type Book struct {
	ID    int32
	Title string
}

type memoryDB struct {
	nextID  int32
	records []Book
}

func newMemoryDB() *memoryDB { return &memoryDB{nextID: 1, records: make([]Book, 0)} }

func (db *memoryDB) List() []Book {
	out := make([]Book, len(db.records))
	copy(out, db.records)
	return out
}

func (db *memoryDB) Create(title string) Book {
	b := Book{ID: db.nextID, Title: title}
	db.nextID++
	db.records = append(db.records, b)
	return b
}
