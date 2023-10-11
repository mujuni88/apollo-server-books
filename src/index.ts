import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { LRUCache } from "typescript-lru-cache";
import { categories, books, Book, Category } from "./data";

const BOOK_PREFIX = "book-";
const CATEGORY_PREFIX = "cat-";

const cache = new LRUCache<string, Book | Category>({
  maxSize: 100,
  entryExpirationTimeInMS: 5000,
  onEntryEvicted: ({ key, value, isExpired }) =>
    console.log(
      `Entry with key ${key} and value ${value} was evicted from the cache. Expired: ${isExpired}`,
    ),
  onEntryMarkedAsMostRecentlyUsed: ({ key, value }) =>
    console.log(
      `Entry with key ${key} and value ${value} was just marked as most recently used.`,
    ),
});

export const genBookId = (title: string) =>
  BOOK_PREFIX +
  title
    .split(" ")
    .map((t) => t[0])
    .join("")
    .toLocaleLowerCase();

export const genCategoryId = (name: string) =>
  CATEGORY_PREFIX + name.split(" ").join("-").toLocaleLowerCase();

// Function to remove a category from all books
const removeCategoryFromBooks = (categoryId: string) => {
  const booksToUpdate: any[] = [];

  cache.forEach((book, bookId) => {
    if ("name" in book) return;

    const updatedCategories = (book.categories ?? []).filter(
      (category) => category.id !== categoryId,
    );

    if (updatedCategories.length !== (book.categories ?? []).length) {
      booksToUpdate.push({
        ...book,
        id: bookId,
        categories: updatedCategories,
      });
    }
  });

  // Update the books in the cache
  booksToUpdate.forEach((updatedBook) => {
    cache.set(updatedBook.id, updatedBook);
  });
};

// Function to populate books to cache
const populateBooksToCache = () => {
  const cachedBooks: Book[] = [];
  books.forEach(({ id, title, categories }) => {
    const book = { id, title, categories };
    cache.set(id, book);
    cachedBooks.push(book);
  });
  return cachedBooks;
};

// Function to populate categories to cache
const populateCategoriesToCache = () => {
  const cachedCategories: Category[] = [];
  categories.forEach(({ id, name }) => {
    const category = { id, name };
    cache.set(id, category);
    cachedCategories.push(category);
  });
  return cachedCategories;
};

// Seed Data
populateBooksToCache();
populateCategoriesToCache();

// Schema definition
const typeDefs = `
type Category {
  id: String!
  name: String!
}

type Book {
  id: String!
  title: String!
  categories: [Category]
}

type SeedData {
  books: [Book]!
  categories: [Category]!
}

input BookFilter {
  categoryId: String
} 

input CategoryInput {
  id: String!
  name: String!
}

type Query {
  books(filter: BookFilter): [Book]
  book(id: String!): Book
  categories: [Category]
  category(id: String!): Category
}

type Mutation {
  addBook(title: String!, categories: [CategoryInput]): Book
  updateBook(id: String!, title: String!, categories: [CategoryInput]): Book
  deleteBook(id: String!): Boolean

  addCategory(name: String!): Category
  updateCategory(id: String!, name: String!): Category
  deleteCategory(id: String!): Boolean

  seedData(filter:String): SeedData
}
`;
// Resolver definitions
type BookFilter = {
  filter: {
    categoryId: string;
  };
};

type BookInput = {
  id: string;
  title: string;
  categories?: Category[];
};

type CategoryInput = {
  id: string;
  name: string;
};

type IdArg = {
  id: string;
};

const resolvers = {
  Query: {
    books: (_: any, args: BookFilter) => {
      const books: Book[] = [];

      cache.forEach((book, id) => {
        if ("name" in book) return;
        books.push({ ...book, id });
      });

      if (args.filter && args.filter.categoryId) {
        const categoryId = genCategoryId(args.filter.categoryId);
        return books.filter((book) =>
          (book?.categories ?? []).map((c) => c.id === categoryId),
        );
      }

      return books;
    },
    book: (_: any, { id }: IdArg) => {
      return cache.get(id);
    },
    categories: (_: any, args: any) => {
      const categories: Category[] = [];

      cache.forEach((category, id) => {
        if ("title" in category) return;
        categories.push({ ...category, id });
      });
      return categories;
    },
    category: (_: any, { id }: IdArg) => {
      return cache.get(id);
    },
  },
  Mutation: {
    addBook: (_: any, { title, categories }: Omit<BookInput, "id">) => {
      const id = genBookId(title);
      const book: Book = { title, categories, id };
      cache.set(id, book);
      return book;
    },
    updateBook: (_: any, { title, id, categories }: BookInput) => {
      if (!title) return;
      const book = { title, categories, id };
      cache.set(id, book);
      return book;
    },
    deleteBook(_: any, { id }: IdArg) {
      return cache.delete(id);
    },
    addCategory: (_: any, { name }: Omit<CategoryInput, "id">) => {
      const id = genCategoryId(name);
      const category = { name, id };
      cache.set(id, category);
      return category;
    },
    updateCategory: (_: any, { name, id }: CategoryInput) => {
      if (!name) return;
      const category = { name, id };
      cache.set(id, category);
      return category;
    },
    deleteCategory(_: any, { id }: IdArg) {
      cache.delete(id);
      removeCategoryFromBooks(id);
      return true;
    },
    seedData(_: any) {
      const books = populateBooksToCache();
      const categories = populateCategoriesToCache();
      return {
        books,
        categories,
      };
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
startStandaloneServer(server, {
  context: async ({ req }) => ({ token: req.headers.token }),
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
