import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import LRU from "lru-cache";

const BOOK_PREFIX = "book-";
const CATEGORY_PREFIX = "cat-";

const categories = [
  { id: "cat-fiction", name: "Fiction" },
  { id: "cat-non-fiction", name: "Non Fiction" },
  { id: "cat-biography", name: "Biography" },
  { id: "cat-sports", name: "Sports" },
  { id: "cat-science", name: "Science" },
  { id: "cat-history", name: "History" },
];
const books = [
  {
    id: "book-tkmb",
    title: "To Kill a Mockingbird",
    categories: [categories[0]],
  },
  {
    id: "book-hpss",
    title: "Harry Potter and the Sorcerer's Stone",
    categories: [categories[0]],
  },
  {
    id: "book-1984",
    title: "1984",
    categories: [categories[0]],
  },
  {
    id: "book-sapiens",
    title: "Sapiens: A Brief History of Humankind",
    categories: [categories[1]],
  },
  {
    id: "book-mlk",
    title: "The Autobiography of Martin Luther King, Jr.",
    categories: [categories[2]],
  },
  {
    id: "book-mjsm",
    title: "Michael Jordan: The Life",
    categories: [categories[3]],
  },
];

const cache = LRU({ max: 25, maxAge: 1000 * 60 * 5 });

export const genBookId = (title: string) =>
  BOOK_PREFIX +
  title
    .split(" ")
    .map((t) => t[0])
    .join("")
    .toLocaleLowerCase();

export const genCategoryId = (name: string) =>
  CATEGORY_PREFIX +
  name.split(" ").join("-").toLocaleLowerCase();

// Preload the cache with the books
books.forEach(({ id, title, categories }) => {
  cache.set(id, { title, categories, id });
});

categories.forEach(({ id, name }) => {
  cache.set(id, { id, name });
});

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
}
`;
// Resolver definitions
const resolvers = {
  Query: {
    books: (_, args) => {
      const books = [];

      cache.forEach((book, id) => {
        if (!book || !id.startsWith(BOOK_PREFIX)) return;
        books.push({ ...book, id });
      });

      if (args.filter && args.filter.category) {
        const categoryId = genCategoryId(args.filter.category);
        return books.filter((book) =>
          book.categories.map((c) => c.id === categoryId),
        );
      }

      return books;
    },
    book: (_, { id }) => {
      return cache.get(id);
    },
    categories: (_, args) => {
      const categories = [];

      cache.forEach((category, id) => {
        if (!category || !id.startsWith(CATEGORY_PREFIX)) return;
        categories.push({ ...category, id });
      });
      return categories;
    },
    category: (_, { id }) => {
      return cache.get(id);
    },
  },
  Mutation: {
    addBook: (_, { title, categories }) => {
      const id = genBookId(title);
      const book = { title, categories, id };
      cache.set(id, book);
      return book;
    },
    updateBook: (_, { title, id, categories }) => {
      if (!title) return;
      const book = { title, categories, id };
      cache.set(id, book);
      return book;
    },
    deleteBook(_, { id }) {
      return cache.set(id, undefined);
    },
    addCategory: (_, { name }) => {
      const id = genCategoryId(name);
      const category = { name, id };
      cache.set(id, category);
      return category;
    },
    updateCategory: (_, { name, id }) => {
      if (!name) return;
      const category = { name, id };
      cache.set(id, category);
      return category;
    },
    deleteCategory(_, { id }) {
      return cache.set(id, undefined);
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => ({ token: req.headers.token }),
  listen: { port: 4000 },
});
console.log(`🚀  Server ready at ${url}`);
