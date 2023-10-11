"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genCategoryId = exports.genBookId = void 0;
const server_1 = require("@apollo/server");
const standalone_1 = require("@apollo/server/standalone");
const lru_cache_1 = __importDefault(require("lru-cache"));
const data_1 = require("./data");
const BOOK_PREFIX = "book-";
const CATEGORY_PREFIX = "cat-";
const cache = (0, lru_cache_1.default)({ max: 25, maxAge: 1000 * 60 * 5 });
const genBookId = (title) => BOOK_PREFIX +
    title
        .split(" ")
        .map((t) => t[0])
        .join("")
        .toLocaleLowerCase();
exports.genBookId = genBookId;
const genCategoryId = (name) => CATEGORY_PREFIX + name.split(" ").join("-").toLocaleLowerCase();
exports.genCategoryId = genCategoryId;
// Function to remove a category from all books
const removeCategoryFromBooks = (categoryId) => {
    const booksToUpdate = [];
    cache.forEach((book, bookId) => {
        if (!book || !bookId.startsWith(BOOK_PREFIX))
            return;
        const updatedCategories = book.categories.filter((category) => category.id !== categoryId);
        if (updatedCategories.length !== book.categories.length) {
            booksToUpdate.push(Object.assign(Object.assign({}, book), { id: bookId, categories: updatedCategories }));
        }
    });
    // Update the books in the cache
    booksToUpdate.forEach((updatedBook) => {
        cache.set(updatedBook.id, updatedBook);
    });
};
// Function to populate books to cache
const populateBooksToCache = () => {
    const cachedBooks = [];
    data_1.books.forEach(({ id, title, categories }) => {
        const book = { id, title, categories };
        cache.set(id, book);
        cachedBooks.push(book);
    });
    return cachedBooks;
};
// Function to populate categories to cache
const populateCategoriesToCache = () => {
    const cachedCategories = [];
    data_1.categories.forEach(({ id, name }) => {
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
const resolvers = {
    Query: {
        books: (_, args) => {
            const books = [];
            cache.forEach((book, id) => {
                if (!book || !id.startsWith(BOOK_PREFIX))
                    return;
                books.push(Object.assign(Object.assign({}, book), { id }));
            });
            if (args.filter && args.filter.category) {
                const categoryId = (0, exports.genCategoryId)(args.filter.category);
                return books.filter((book) => book.categories.map((c) => c.id === categoryId));
            }
            return books;
        },
        book: (_, { id }) => {
            return cache.get(id);
        },
        categories: (_, args) => {
            const categories = [];
            cache.forEach((category, id) => {
                if (!category || !id.startsWith(CATEGORY_PREFIX))
                    return;
                categories.push(Object.assign(Object.assign({}, category), { id }));
            });
            return categories;
        },
        category: (_, { id }) => {
            return cache.get(id);
        },
    },
    Mutation: {
        addBook: (_, { title, categories }) => {
            const id = (0, exports.genBookId)(title);
            const book = { title, categories, id };
            cache.set(id, book);
            return book;
        },
        updateBook: (_, { title, id, categories }) => {
            if (!title)
                return;
            const book = { title, categories, id };
            cache.set(id, book);
            return book;
        },
        deleteBook(_, { id }) {
            return cache.set(id, undefined);
        },
        addCategory: (_, { name }) => {
            const id = (0, exports.genCategoryId)(name);
            const category = { name, id };
            cache.set(id, category);
            return category;
        },
        updateCategory: (_, { name, id }) => {
            if (!name)
                return;
            const category = { name, id };
            cache.set(id, category);
            return category;
        },
        deleteCategory(_, { id }) {
            cache.set(id, undefined);
            removeCategoryFromBooks(id);
            return true;
        },
        seedData(_) {
            const books = populateBooksToCache();
            const categories = populateCategoriesToCache();
            return {
                books,
                categories,
            };
        },
    },
};
const server = new server_1.ApolloServer({ typeDefs, resolvers });
(0, standalone_1.startStandaloneServer)(server, {
    context: ({ req }) => __awaiter(void 0, void 0, void 0, function* () { return ({ token: req.headers.token }); }),
    listen: { port: 4000 },
}).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});
