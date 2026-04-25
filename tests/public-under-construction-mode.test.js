import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("public routes wire under-construction runtime mode to a unified holding surface", () => {
  const homeSource = readFileSync(new URL("../app/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const servicesIndex = readFileSync(new URL("../app/services/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const servicesDetail = readFileSync(new URL("../app/services/[slug]/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const casesIndex = readFileSync(new URL("../app/cases/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const casesDetail = readFileSync(new URL("../app/cases/[slug]/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const aboutSource = readFileSync(new URL("../app/about/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const contactsSource = readFileSync(new URL("../app/contacts/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const renderersSource = readFileSync(new URL("../components/public/PublicRenderers.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  for (const source of [homeSource, servicesIndex, servicesDetail, casesIndex, casesDetail, aboutSource, contactsSource]) {
    assert.match(source, /runtimeDisplayMode\.underConstruction/);
    assert.match(source, /PublicHoldingPage/);
  }

  assert.match(renderersSource, /homeMosaic/);
  assert.match(renderersSource, /В разработке/);
  assert.doesNotMatch(renderersSource, /UNDER CONSTRUCTION - NOT LAUNCH CONTENT/);
  assert.doesNotMatch(renderersSource, /Under construction mode/);
});
