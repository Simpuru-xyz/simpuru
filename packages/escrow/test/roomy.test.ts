import { expect, test } from "bun:test";
import { pickRoomy } from "../src/actions";

const u = (ada: number) => ({ assets: { lovelace: BigInt(ada * 1_000_000) } });

test("prefers UTxOs of 10 ADA or more", () => {
  expect(pickRoomy([u(3), u(12), u(5), u(20)]).map((x) => x.assets.lovelace)).toEqual([
    12_000_000n,
    20_000_000n,
  ]);
});

test("without one, offers only the largest so collateral can't land on a small UTxO", () => {
  expect(pickRoomy([u(2), u(5.6), u(4.3), u(2)])).toEqual([u(5.6)]);
});

test("an empty wallet stays empty", () => {
  expect(pickRoomy([])).toEqual([]);
});
