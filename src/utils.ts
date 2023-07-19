import { generate } from "shortid";

export const generateId = () => generate();

export const generateIdFromTitle = (title: string) =>
  title.split(" ").join("-").toLocaleLowerCase();
