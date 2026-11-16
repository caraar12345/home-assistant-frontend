import { dump, load } from "js-yaml";
import { describe, expect, it } from "vitest";
import {
  ADDON_YAML_SCHEMA,
  hasUnsafeInteger,
} from "../../../../src/panels/config/apps/app-view/config/addon-yaml-schema";

const parse = (yaml: string) => load(yaml, { schema: ADDON_YAML_SCHEMA });

describe("ADDON_YAML_SCHEMA", () => {
  it("keeps integers beyond the safe range exact", () => {
    expect(parse("id: 240857690820182016")).toEqual({
      id: "240857690820182016",
    });
    expect(parse("id: -240857690820182016")).toEqual({
      id: "-240857690820182016",
    });
    expect(parse("id: +240_857_690_820_182_016")).toEqual({
      id: "240857690820182016",
    });
  });

  it("still parses safe integers as numbers", () => {
    expect(parse("port: 8080\nmax: 9007199254740991")).toEqual({
      port: 8080,
      max: Number.MAX_SAFE_INTEGER,
    });
  });

  it("keeps secrets and quoted values", () => {
    expect(parse('token: !secret discord\nid: "123"')).toEqual({
      token: "!secret discord",
      id: "123",
    });
  });

  it("dumps an exact ID so it parses back unchanged", () => {
    const options = { id: "240857690820182016" };
    expect(parse(dump(options, { schema: ADDON_YAML_SCHEMA }))).toEqual(
      options
    );
  });
});

describe("hasUnsafeInteger", () => {
  it("finds rounded integers anywhere in the options", () => {
    expect(hasUnsafeInteger({ id: 240857690820182016 })).toBe(true);
    expect(hasUnsafeInteger({ users: [{ id: 240857690820182016 }] })).toBe(
      true
    );
  });

  it("ignores safe numbers, floats and strings", () => {
    expect(
      hasUnsafeInteger({ port: 8080, ratio: 1.5, id: "240857690820182016" })
    ).toBe(false);
  });
});
