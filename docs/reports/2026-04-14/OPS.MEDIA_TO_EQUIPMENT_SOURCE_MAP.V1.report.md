# OPS.MEDIA_TO_EQUIPMENT_SOURCE_MAP.V1

## Purpose

This report records the source basis used to create `equipment` cards from the current `media_asset` cards and to refresh the media SEO-facing text fields.

The execution batch for this run lives in:

- `var/entity-ops/media-to-equipment-2026-04-14.json`

## Source policy

- Prefer official manufacturer or brand-owner pages.
- When the official page is unavailable or too thin for a specific model, use a current direct dealer page and note it explicitly.
- Do not invent unsupported specs.
- Treat the media card as the relation anchor, not as the spec authority.

## Mapping

### `entity_b70746e6-13cc-49ba-9198-bcd0cf1101ab`

- Media title basis: `Гусеничный экскаватор ZAUBERG EX-210CX`
- Equipment slug: `zauberg-ex-210cx`
- Primary source: `https://zauberg.ru/good-7313-ekskavator-zauberg-ex-210cx`
- Source basis used:
  - working weight `20,8 т`
  - bucket `0,9 м³`
  - digging depth `6690 мм`
  - engine `Cummins`, `112 кВт`
  - dump height `6813 мм`

### `entity_8e5e0d89-fa99-40c9-9e47-e77f2f00288c`

- Media title basis: `Экскаватор гусеничный Zauberg EX-210C`
- Equipment slug: `zauberg-ex-210c`
- Primary source: `https://zauberg.ru/good-7311-ekskavator-zauberg-ex-210c`
- Source basis used:
  - working weight `20,1 т`
  - bucket `1,0 м³`
  - digging depth `6690 мм`
  - engine `Cummins 6BTAA5.9-C150`
  - power `112 кВт`
  - dump height `6813 мм`

### `entity_193254fe-2ef2-4dba-b10a-c16c694e7557`

- Media title basis: `Экскаватор ZAUBERG E370-C`
- Equipment slug: `zauberg-e370-c`
- Primary source: `https://zauberg.ru/good-7254-ekskavator-zauberg-e370-c`
- Source basis used:
  - working weight `35,6 т`
  - bucket `1,8 м³`
  - digging depth `7200 мм`
  - power `242 кВт`
  - digging force `188 кН`
  - dump height `7024 мм`

### `entity_1fbc176c-467e-46bd-8a52-95391b12ecfb`

- Media title basis: `Фронтальный погрузчик Zauberg WL28`
- Equipment slug: `zauberg-wl28`
- Primary source: `https://zauberg.ru/good-7384-frontalnyy-pogruzchik-zauberg-wl28`
- Source basis used:
  - payload `2800 кг`
  - operating weight `8170 кг`
  - bucket `1,3 м³`
  - engine `Weichai Deutz 6105 turbo`
  - power `125 л.с.`
  - dump height `3600 мм`

### `entity_dd72e28d-36eb-4638-93b1-bb99590a6800`

- Media title basis: `Мини-погрузчики Lonking CDM307`
- Equipment slug: `lonking-cdm307`
- Primary source: `https://centr-teh.ru/product-mini-pogruzchik-lonking-cdm307-2-7068`
- Secondary source: `https://po.lonkinggroup.com/product/constructionmachinery.htm`
- Source basis used:
  - payload `800 кг`
  - bucket `0,43 м³`
  - dump height `3020 мм`
  - operating weight `2800 кг`
  - engine `Xinchai`
  - power `50 л.с.`
- Inference:
  - The official manufacturer catalog page confirms the model family and attachment-oriented positioning.
  - The dealer page was used as the concrete Russian-language spec sheet because it exposes the working dimensions and payload values needed for the card.

## Cleanup note

There is an existing test-only `equipment` draft linked to the EX-210C media asset:

- `entity_85793a87-4d33-4f3b-9da2-0af0ba8ee612`

The batch updates that draft into the real EX-210C equipment card and removes the old test page:

- `entity_dd7222fd-c8cc-43e7-a559-543118ef2eb2`

This keeps the final shape aligned with the intended `1 media_asset -> 1 equipment` relation.
