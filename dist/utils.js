import { generate } from "shortid";
export const generateId = () => generate();
export const generateIdFromTitle = (title) => title.split(" ").join("-").toLocaleLowerCase();
