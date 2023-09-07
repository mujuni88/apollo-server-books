import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import LRU from "lru-cache";
const books = [
    { title: "To Kill a Mockingbird", categories: ["FICTION"] },
    { title: "1984", categories: ["FICTION"] },
    { title: "Harry Potter and the Sorcerer's Stone", categories: ["FICTION"] },
    { title: "The Great Gatsby", categories: ["FICTION"] },
    { title: "The Diary of a Young Girl", categories: ["BIOGRAPHY"] },
    { title: "The Catcher in the Rye", categories: ["FICTION"] },
    { title: "Pride and Prejudice", categories: ["FICTION"] },
    { title: "The Hobbit", categories: ["FICTION"] },
    { title: "Moby Dick", categories: ["FICTION"] },
    { title: "War and Peace", categories: ["FICTION"] },
    { title: "The Odyssey", categories: ["FICTION"] },
    { title: "The Art of War", categories: ["NON-FICTION"] },
    { title: "A Brief History of Time", categories: ["NON-FICTION"] },
    { title: "The God Delusion", categories: ["NON-FICTION"] },
    {
        title: "Sapiens: A Brief History of Humankind",
        categories: ["NON-FICTION"],
    },
    { title: "Steve Jobs", categories: ["BIOGRAPHY"] },
    { title: "Long Walk to Freedom", categories: ["BIOGRAPHY"] },
    {
        title: "The Autobiography of Martin Luther King, Jr.",
        categories: ["BIOGRAPHY"],
    },
    {
        title: "Moneyball: The Art of Winning an Unfair Game",
        categories: ["SPORTS"],
    },
    { title: "Open: An Autobiography", categories: ["BIOGRAPHY", "SPORTS"] },
];
const cache = LRU({ max: 25, maxAge: 1000 * 60 * 5 });
export const generateIdFromTitle = (title) => title.split(" ").join("-").toLocaleLowerCase();
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
            cache.forEach((book, id) => books.push({ ...book, id }));
            if (args.filter && args.filter.category) {
                const filterCategory = args.filter.category.toUpperCase();
                return books.filter((book) => book.categories.map((c) => c.toUpperCase()).includes(filterCategory));
            }
            return books;
        },
        book: (_, { id }) => {
            return { id, ...cache.get(id) };
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
