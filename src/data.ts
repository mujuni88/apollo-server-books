export interface Category {
  id: string;
  name: string;
}
export interface Book {
  id: string;
  title: string;
  categories?: Category[];
}

export const categories: Category[] = [
  { id: "cat-fiction", name: "Fiction" },
  { id: "cat-non-fiction", name: "Non Fiction" },
  { id: "cat-biography", name: "Biography" },
  { id: "cat-sports", name: "Sports" },
  { id: "cat-science", name: "Science" },
  { id: "cat-history", name: "History" },
];

export const books: Book[] = [
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
