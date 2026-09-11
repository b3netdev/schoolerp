import assert from "node:assert/strict";
import test from "node:test";

import {
  validateStudentBulkRow,
  type StudentBulkUploadSettings,
} from "../utils/studentBulkUpload.js";

const settings: StudentBulkUploadSettings = {
  generationType: "auto",
  prefix: "ST",
  requiredLength: 5,
};

test("validateStudentBulkRow accepts valid student data and rejects invalid rows", async () => {
  const valid = await validateStudentBulkRow(
    {
      first_name: "Alice",
      last_name: "Johnson",
      email: "alice@example.com",
      phone: "9876543210",
      password: "secret123",
      status: "active",
    },
    settings,
    {
      existingEmails: new Set(),
      existingPhones: new Set(),
      existingStudentCodes: new Set(),
    },
  );

  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, []);

  const invalid = await validateStudentBulkRow(
    {
      first_name: "",
      email: "",
      password: "123",
      status: "pending",
    },
    settings,
    {
      existingEmails: new Set(["alice@example.com"]),
      existingPhones: new Set(),
      existingStudentCodes: new Set(),
    },
  );

  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.some((message) => message.includes("First name is required")));
  assert.ok(invalid.errors.some((message) => message.includes("Password must be at least 6 characters")));
  assert.ok(invalid.errors.some((message) => message.includes("Student status must be active or inactive")));
});
