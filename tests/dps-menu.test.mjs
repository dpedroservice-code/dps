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


test("the shared navigation has responsive and keyboard-accessible styles", async () => {
  const css = await read("../assets/css/site-shell.css");
  assert.ok(css.includes("@media(max-width:1100px)"));
  assert.ok(css.includes(".site-menu.is-open"));
  assert.ok(css.includes(":focus-visible"));
  assert.ok(css.includes("max-height:70vh"));
});


test("a loja virtual encaminha para a secção SPA correta", async () => {
  const page = await read("../loja-virtual.html");
  assert.ok(page.includes("index.html#loja"), "a loja deve abrir a secção page-loja");
  assert.ok(!page.includes("index.html#productsGrid"), "não deve usar um hash que o router não reconhece");
});

test("o catálogo público carrega mesmo quando existe cliente Supabase Auth", async () => {
  const cloud = await read("../assets/js/cloud-store.js");
  const init = cloud.split("document.addEventListener('DOMContentLoaded'")[1]?.split("window.DPS_CLOUD_STORE")[0];
  assert.ok(init, "cloud-store deve inicializar no carregamento da página");
  assert.ok(init.includes("publicProducts()"), "o catálogo público deve ser solicitado");
  assert.ok(!/if\s*\(window\.DPAuth\?\.client\)\s*return/.test(init),
    "a presença do SDK Auth não pode impedir a consulta pública");
});
