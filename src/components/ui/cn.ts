export const cn = (...tokens: Array<string | undefined | null | false>): string =>
  tokens.filter((token): token is string => Boolean(token)).join(" ");
