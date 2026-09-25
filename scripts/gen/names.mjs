/**
 * Naming helpers for the generator. Input is a singular kebab-case noun
 * (`invoice`, `api-key`); every other casing is derived from it.
 */
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function assertKebabCase(value) {
  if (!KEBAB.test(value)) {
    throw new Error(`"${value}" must be singular kebab-case, e.g. "invoice" or "api-key".`);
  }
}

export function pluralize(word) {
  if (/(s|x|z|ch|sh)$/.test(word)) return `${word}es`;
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

const words = (kebab) => kebab.split('-');
const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

export function buildNames(singular, pluralOverride) {
  assertKebabCase(singular);
  const plural = pluralOverride ?? pluralize(singular);
  assertKebabCase(plural);
  const pascal = (value) => words(value).map(capitalize).join('');
  const camel = (value) => {
    const p = pascal(value);
    return p.charAt(0).toLowerCase() + p.slice(1);
  };
  return {
    kebab: singular,
    kebabPlural: plural,
    pascal: pascal(singular),
    pascalPlural: pascal(plural),
    camel: camel(singular),
    camelPlural: camel(plural),
    snakePlural: words(plural).join('_'),
    snake: words(singular).join('_'),
    title: words(singular).join(' '),
  };
}
