// The dispute intent encoding is checked against signatures the vested_pay test
// suite itself accepts (vested_pay.ak, "REAL ed25519 CIP-8 signatures"):
// own_ref = (0x11 * 32, 0), empty buyer and seller values. If our CBOR differed
// from Aiken's cbor.serialise by a single byte, these signatures would not verify.
import { describe, expect, test } from "bun:test";
import { Data } from "@evolution-sdk/evolution";
import { blake2b } from "@noble/hashes/blake2.js";
import {
  assetValueData,
  disputeIntentHash,
  outputReferenceData,
  verifyAdminSignature,
} from "../src/dispute";

const intent = disputeIntentHash(
  outputReferenceData("11".repeat(32), 0n),
  assetValueData({}),
  assetValueData({}),
);

describe("dispute intent matches the validator's own vectors", () => {
  test("raw {1:-8} signature verifies", () => {
    expect(
      verifyAdminSignature(
        {
          verificationKey: "e734ea6c2b6257de72355e472aa05a4c487e6b463c029ed306df2f01b5636b58",
          protectedHeaders: "a10127",
          signature:
            "35d26314b3d2efd22e7e45d1a1a3baefd7d9988636dab010126663f0099ad296ef7c7a85feed18ba5626993aa6c4abcb47617041481941d7419671575a5eed09",
        },
        intent,
      ),
    ).toBe(true);
  });

  test("CIP-30 wallet signature verifies", () => {
    expect(
      verifyAdminSignature(
        {
          verificationKey: "c32dfdb461dd016e8fdd9b6d424a77439eab8f8c644a804b013b6cefa2454f95",
          protectedHeaders:
            "a30127045820c32dfdb461dd016e8fdd9b6d424a77439eab8f8c644a804b013b6cefa2454f9567616464726573735839005867c3b8e27840f556ac268b781578b14c5661fc63ee720dbeab663f9d4dcd7e454d2434164f4efb8edeb358d86a1dad9ec6224cfcbce3e6",
          signature:
            "1eadf611c719a35bdd30fb9e1712cd493d8a7982ffd1dbacb7f05eb778af4768a176fd59bb3fff52c66111e603f0f8b01bbcb6d49896d04f4c589c011d97ec02",
        },
        intent,
      ),
    ).toBe(true);
  });

  test("hashed-mode signature verifies", () => {
    expect(
      verifyAdminSignature(
        {
          verificationKey: "7d59c5623dd40a74aa4d5a32ac645d3b3f95daeae4c22be25476dd6a486f7382",
          protectedHeaders: "a10127",
          signature:
            "d7bb6c902225a66f248c051b3c80857fa2983c8df69a53326ac289cd87672014576d5276cc3d30794284ed407ef5d17c54dd2146725cd62151e5b6b8ff307b0b",
        },
        intent,
      ),
    ).toBe(true);
  });

  test("double-hashed signature is rejected, as the validator rejects it", () => {
    expect(
      verifyAdminSignature(
        {
          verificationKey: "7d59c5623dd40a74aa4d5a32ac645d3b3f95daeae4c22be25476dd6a486f7382",
          protectedHeaders: "a10127",
          signature:
            "9c70279d27fc400399479dd9d2a79d53db4747ec56752d9adb9ef0e17af93bf5abdcd8fd19c9f70dbfce7033763e30c4f0e672ea026442ff9f5acfef5e40d206",
        },
        intent,
      ),
    ).toBe(false);
  });

  test("a different own_ref breaks the signature (it is bound to one UTxO)", () => {
    const other = disputeIntentHash(
      outputReferenceData("11".repeat(32), 1n),
      assetValueData({}),
      assetValueData({}),
    );
    expect(
      verifyAdminSignature(
        {
          verificationKey: "e734ea6c2b6257de72355e472aa05a4c487e6b463c029ed306df2f01b5636b58",
          protectedHeaders: "a10127",
          signature:
            "35d26314b3d2efd22e7e45d1a1a3baefd7d9988636dab010126663f0099ad296ef7c7a85feed18ba5626993aa6c4abcb47617041481941d7419671575a5eed09",
        },
        other,
      ),
    ).toBe(false);
  });
});

// The vectors above all use empty values, which encode the same in every CBOR style (a0),
// so they could not catch a map-encoding mismatch. This one has a non-empty value, and the
// validator itself accepted a payout signed over exactly this intent on preprod:
// tx 074da4b5eda0a23af5513f9d4115f0d74f70c12e109a8353ca256bcf15ba90ec.
describe("dispute intent with a non-empty value", () => {
  const ownRef = outputReferenceData(
    "4525304ddf22e8eb382eb19d9d20f0100dcacc18d2250cfbe6517ef05b605fff",
    0n,
  );
  const buyer = assetValueData({ lovelace: 5_000_000n });
  const seller = assetValueData({});

  test("matches the intent the validator accepted on preprod", () => {
    expect(Buffer.from(disputeIntentHash(ownRef, buyer, seller)).toString("hex")).toBe(
      "2997941cdbd1b1844a0c7e927aea4c1c42bf56065416f43dbf8fe43a",
    );
  });

  test("the SDK's default encoding would not (maps written indefinite)", () => {
    const withdrawal = Data.constr(0n, [ownRef, buyer, seller]);
    const viaDefault = blake2b(Data.toCBORBytes(withdrawal), { dkLen: 28 });
    expect(Buffer.from(viaDefault).toString("hex")).not.toBe(
      "2997941cdbd1b1844a0c7e927aea4c1c42bf56065416f43dbf8fe43a",
    );
  });
});
