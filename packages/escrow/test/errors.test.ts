import { describe, expect, test } from "bun:test";
import { errorText } from "../src/actions";

describe("errorText", () => {
  test("includes the provider's answer buried in the cause chain", () => {
    const http = new Error('non 2xx status code : {"tag":"TxCmdTxSubmitConnectionError"}');
    const provider = new Error("Koios submitTx failed", { cause: http });
    const top = new Error("Failed to submit transaction", { cause: provider });
    expect(String(top)).not.toContain("TxSubmitConnectionError");
    expect(errorText(top)).toContain("TxSubmitConnectionError");
  });

  test("stops on a cause cycle", () => {
    const a = new Error("a");
    const b = new Error("b", { cause: a });
    (a as { cause?: unknown }).cause = b;
    expect(errorText(a)).toBe("a <- b");
  });
});
