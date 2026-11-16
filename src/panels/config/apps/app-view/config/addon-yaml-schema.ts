import { defineScalarTag, intYaml11Tag, YAML11_SCHEMA } from "js-yaml";

const secretTag = defineScalarTag("!secret", {
  resolve: (data) => `!secret ${data}`,
  identify: () => false,
});

const DECIMAL_INTEGER = /^[-+]?(?:0|[1-9][0-9_]*)$/;

// Integers beyond Number.MAX_SAFE_INTEGER (such as 64-bit Discord or Telegram
// IDs) are silently rounded when parsed as a JavaScript number. Keep their
// exact digits as a string instead: Supervisor coerces it back to an exact
// integer for `int` options, and `str` options accept it as is.
const exactIntTag = defineScalarTag(intYaml11Tag.tagName, {
  ...intYaml11Tag,
  resolve: (source, isExplicit, tagName) => {
    const value = intYaml11Tag.resolve(source, isExplicit, tagName);
    if (
      typeof value === "number" &&
      !Number.isSafeInteger(value) &&
      DECIMAL_INTEGER.test(source)
    ) {
      return source.replace(/^\+|_/g, "");
    }
    return value;
  },
});

export const ADDON_YAML_SCHEMA = YAML11_SCHEMA.withTags(secretTag, exactIntTag);

// Options arrive over the WebSocket API as JSON, so an integer beyond the
// safe range has already been rounded before the frontend sees it.
export const hasUnsafeInteger = (value: unknown): boolean => {
  if (typeof value === "number") {
    return Number.isInteger(value) && !Number.isSafeInteger(value);
  }
  if (value && typeof value === "object") {
    return Object.values(value).some(hasUnsafeInteger);
  }
  return false;
};
