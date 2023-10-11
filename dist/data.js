"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.books = exports.categories = void 0;
exports.categories = [
    { id: "cat-fiction", name: "Fiction" },
    { id: "cat-non-fiction", name: "Non Fiction" },
    { id: "cat-biography", name: "Biography" },
    { id: "cat-sports", name: "Sports" },
    { id: "cat-science", name: "Science" },
    { id: "cat-history", name: "History" },
];
exports.books = [
    {
        id: "book-tkmb",
        title: "To Kill a Mockingbird",
        categories: [exports.categories[0]],
    },
    {
        id: "book-hpss",
        title: "Harry Potter and the Sorcerer's Stone",
        categories: [exports.categories[0]],
    },
    {
        id: "book-1984",
        title: "1984",
        categories: [exports.categories[0]],
    },
    {
        id: "book-sapiens",
        title: "Sapiens: A Brief History of Humankind",
        categories: [exports.categories[1]],
    },
    {
        id: "book-mlk",
        title: "The Autobiography of Martin Luther King, Jr.",
        categories: [exports.categories[2]],
    },
    {
        id: "book-mjsm",
        title: "Michael Jordan: The Life",
        categories: [exports.categories[3]],
    },
];
