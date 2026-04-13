import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES, PAGE_CREATE_MODES } from "../../lib/content-core/content-types.js";
import {
  getEntityQuestionHint,
  getManagementQuestionHint,
  getPageCreateModeQuestionHint,
  getWorkspaceQuestionHint
} from "../../lib/admin/question-model.js";
import {
  getEntityEditorLegend,
  getEntityListLegend,
  getScreenLegend
} from "../../lib/admin/screen-copy.js";

test("question-model hints stay short and canonical for key entities", () => {
  assert.equal(getEntityQuestionHint(ENTITY_TYPES.MEDIA_ASSET), "Отвечает на вопрос: как это выглядит?");
  assert.equal(getEntityQuestionHint(ENTITY_TYPES.SERVICE), "Отвечает на вопрос: что мы предлагаем?");
  assert.equal(getEntityQuestionHint(ENTITY_TYPES.EQUIPMENT), "Отвечает на вопрос: чем и с какими свойствами мы это делаем?");
  assert.equal(getEntityQuestionHint(ENTITY_TYPES.CASE), "Отвечает на вопрос: где это уже сработало?");
  assert.equal(getEntityQuestionHint(ENTITY_TYPES.PAGE), "Отвечает на вопрос: как собрать это в одну публикацию?");
});

test("question-model hints cover create flow and workspace orientation", () => {
  assert.equal(
    getPageCreateModeQuestionHint(PAGE_CREATE_MODES.FROM_SERVICE),
    "Отвечает на вопрос: какую услугу берём за основу страницы?"
  );
  assert.equal(
    getPageCreateModeQuestionHint(PAGE_CREATE_MODES.FROM_EQUIPMENT),
    "Отвечает на вопрос: какую технику берём за основу страницы?"
  );
  assert.equal(
    getWorkspaceQuestionHint("sources"),
    "Отвечают на вопрос: откуда страница берёт факты, медиа и доказательства?"
  );
  assert.equal(
    getWorkspaceQuestionHint("preview"),
    "Отвечает на вопрос: как страница выглядит перед выпуском?"
  );
  assert.equal(
    getManagementQuestionHint("review"),
    "Отвечает на вопрос: можно ли выпускать эту версию дальше?"
  );
});

test("screen legends reuse the question-model pattern in first-layer UI", () => {
  assert.match(getEntityListLegend(ENTITY_TYPES.EQUIPMENT), /Отвечает на вопрос: чем и с какими свойствами мы это делаем\?/);
  assert.match(getEntityEditorLegend(ENTITY_TYPES.PAGE), /Отвечает на вопрос: как собрать это в одну публикацию\?/);
  assert.equal(getScreenLegend("reviewDetail"), "Отвечает на вопрос: можно ли выпускать эту версию дальше?");
});
