import { cache } from "./cache";
import { books, categories, Category, Book } from "./data";
export const BOOK_PREFIX = "book-";
export const CATEGORY_PREFIX = "cat-";

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
export const removeCategoryFromBooks = (categoryId: string) => {
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
export const populateBooksToCache = () => {
  const cachedBooks: Book[] = [];
  books.forEach(({ id, title, categories }) => {
    const book = { id, title, categories };
    cache.set(id, book);
    cachedBooks.push(book);
  });
  return cachedBooks;
};

// Function to populate categories to cache
export const populateCategoriesToCache = () => {
  const cachedCategories: Category[] = [];
  categories.forEach(({ id, name }) => {
    const category = { id, name };
    cache.set(id, category);
    cachedCategories.push(category);
  });
  return cachedCategories;
};
