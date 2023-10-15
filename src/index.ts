import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { Book, Category } from "./data";
import {
  populateBooksToCache,
  populateCategoriesToCache,
  genCategoryId,
  genBookId,
  removeCategoryFromBooks,
} from "./utils";
import { cache } from "./cache";

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
  categoryIds: [String]
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
    categoryIds: string[];
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

      console.log(args);

      if (args?.filter?.categoryIds.length) {
        const categoryIds = args.filter.categoryIds;

        return books.filter((book) =>
          (book?.categories ?? []).some((c) => categoryIds.includes(c.id)),
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
