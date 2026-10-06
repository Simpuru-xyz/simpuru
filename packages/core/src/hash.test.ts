import { expect, test } from "bun:test";
import { contentHash, resultHash } from "./hash";

test("contentHash is plain sha256", () => {
  expect(contentHash("abc")).toBe(
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("resultHash joins identifier and output with ';'", () => {
  expect(resultHash("abc", "def")).toBe(contentHash("abc;def"));
});

test("resultHash detects a tampered output", () => {
  expect(resultHash("id", "output")).not.toBe(resultHash("id", "output "));
});
