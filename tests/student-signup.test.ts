import assert from "node:assert/strict";
import { test } from "node:test";
import { parseStudentSignup } from "../src/lib/student-signup.ts";

test("student signup trims the username and class but preserves the exact password", () => {
  assert.deepEqual(
    parseStudentSignup({ name: "  ana.silva  ", turma: "  1º ano A ", password: " senha123 " }),
    { name: "ana.silva", turma: "1º ano A", password: " senha123 " },
  );
});

test("student signup rejects missing, blank, or oversized identity fields", () => {
  assert.equal(parseStudentSignup(null), null);
  assert.equal(parseStudentSignup({ name: "  ", turma: "1º ano A", password: "senha123" }), null);
  assert.equal(parseStudentSignup({ name: "ana", turma: " ", password: "senha123" }), null);
  assert.equal(parseStudentSignup({ name: "a".repeat(161), turma: "1º ano A", password: "senha123" }), null);
  assert.equal(parseStudentSignup({ name: "ana", turma: "t".repeat(81), password: "senha123" }), null);
});

test("student signup enforces password length without trimming it", () => {
  assert.equal(parseStudentSignup({ name: "ana", turma: "1º ano A", password: "1234567" }), null);
  assert.equal(parseStudentSignup({ name: "ana", turma: "1º ano A", password: "p".repeat(257) }), null);
  assert.equal(parseStudentSignup({ name: "ana", turma: "1º ano A", password: "  123456" })?.password, "  123456");
});
