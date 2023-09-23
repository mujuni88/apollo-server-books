import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import LRU from "lru-cache";

enum Category {
  FICTION = 'FICTION',
  NON_FICTION = 'NON_FICTION',
  BIOGRAPHY = 'BIOGRAPHY',
  SPORTS = 'SPORTS'
}

const books = [
  { title: "To Kill a Mockingbird", categories: [Category.FICTION] },
  { title: "1984", categories: [Category.FICTION] },
  { title: "Harry Potter and the Sorcerer's Stone", categories: [Category.FICTION] },
  { title: "The Great Gatsby", categories: [Category.FICTION] },
  { title: "The Diary of a Young Girl", categories: [Category.BIOGRAPHY] },
  { title: "The Catcher in the Rye", categories: [Category.FICTION] },
  { title: "Pride and Prejudice", categories: [Category.FICTION] },
  { title: "The Hobbit", categories: [Category.FICTION] },
  { title: "Moby Dick", categories: [Category.FICTION] },
  { title: "War and Peace", categories: [Category.FICTION] },
  { title: "The Odyssey", categories: [Category.FICTION] },
  { title: "The Art of War", categories: [Category.NON_FICTION] },
  { title: "A Brief History of Time", categories: [Category.NON_FICTION] },
  { title: "The God Delusion", categories: [Category.NON_FICTION] },
  {
    title: "Sapiens: A Brief History of Humankind",
    categories: [Category.NON_FICTION],
  },
  { title: "Steve Jobs", categories: [Category.BIOGRAPHY] },
  { title: "Long Walk to Freedom", categories: [Category.BIOGRAPHY] },
  {
    title: "The Autobiography of Martin Luther King, Jr.",
    categories: [Category.BIOGRAPHY],
  },
  {
    title: "Moneyball: The Art of Winning an Unfair Game",
    categories: [Category.SPORTS],
  },
  { title: "Open: An Autobiography", categories: [Category.BIOGRAPHY, Category.SPORTS] },
];

const cache = LRU({ max: 25, maxAge: 1000 * 60 * 5 });

export const generateIdFromTitle = (title: string) =>
  title.split(" ").join("-").toLocaleLowerCase();

// Preload the cache with the books
books.forEach(({ title, categories }) => {
  const id = generateIdFromTitle(title);
  cache.set(id, { title, categories, id });
});

// Schema definition
const typeDefs = `
  enum Category {
    FICTION
    NON_FICTION
    BIOGRAPHY
    SPORTS
  }
  
  type Query {
    books(filter: BookFilter): [Book]
    book(id: String!): Book
  }

  type Book {
    id: String!
    title: String!
    categories: [Category]
  }

  type Mutation {
    addBook(title: String!, categories: [Category]): Book
    updateBook(id: String!, title: String!, categories: [Category]): Book
    deleteBook(id: String!): Boolean
  }

  input BookFilter {
    category: Category
  }
`;
// Resolver definitions
const resolvers = {
  Query: {
    books: (_, args) => {
      const books = [];

      cache.forEach((book, id) => { 
        if(!book) return;
        books.push({ ...book, id })
      });

      if (args.filter && args.filter.category) {
        const filterCategory = args.filter.category.toUpperCase();
        return books.filter((book) =>
          book.categories.map((c) => c.toUpperCase()).includes(filterCategory)
        );
      }

      return books;
    },
    book: (_, { id }) => {
      return cache.get(id);
    },
  },
  Mutation: {
    addBook: (_, { title, categories }) => {
      const id = generateIdFromTitle(title);
      const book = { title, categories, id };
      cache.set(id, book);
      return book;
    },
    updateBook: (_, { title, id, categories }) => {
      if(!title) return;
      const book = { title, categories, id };
      cache.set(id, book);
      return book;
    },
    deleteBook(_, { id }) {
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
