import assert from "node:assert/strict";
import test from "node:test";

import { normalizeSubjectListQuery } from "../models/subjects.model.js";

test("normalizeSubjectListQuery accepts valid pagination and class filters", () => {
  const result = normalizeSubjectListQuery({
    status: "all",
    page: "2",
    limit: "5",
    class_id: "7",
    section_id: "3",
  });

  assert.deepEqual(result, {
    status: "all",
    page: 2,
    limit: 5,
    classId: 7,
    sectionId: 3,
  });
});

test("normalizeSubjectListQuery falls back to safe defaults for invalid values", () => {
  const result = normalizeSubjectListQuery({
    status: "trash",
    page: "0",
    limit: "25",
    class_section_id: "9",
  });

  assert.deepEqual(result, {
    status: "trash",
    page: 1,
    limit: 10,
    classSectionId: 9,
  });
});
