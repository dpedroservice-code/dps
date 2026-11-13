import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("all menu destinations point to existing HTML pages", async () => {
  const shell = await read("../assets/js/site-shell.js");
  const navBlock = shell.split("const navItems=[")[1]?.split("function item(")[0];
  assert.ok(navBlock, "site-shell.js must define the primary navigation");
  const destinations = [...navBlock.matchAll(/'([^']+[.]html(?:#[^']*)?)'/g)]
    .map((match) => match[1]);
  assert.ok(destinations.length > 0, "the menu must contain destinations");
  for (const destination of destinations) {
    await access(new URL(`../${destination.split('#')[0]}`, import.meta.url));
  }
});

test("the primary navigation does not repeat the same page destination", async () => {
  const shell = await read("../assets/js/site-shell.js");
  const navBlock = shell.split("const navItems=[")[1]?.split("function item(")[0];
  assert.ok(navBlock, "site-shell.js must define the primary navigation");
  const destinations = [...navBlock.matchAll(/'([^']+[.]html(?:#[^']*)?)'/g)]
    .map((match) => match[1]);
  assert.equal(new Set(destinations).size, destinations.length,
    "each page should appear only once in the primary menu");
});
