// vested_pay V2 datum and redeemer encoding.
//
// The datum is a 19-field Constr 0 (layout in the x402 Cardano spec and in
// vested_pay.ak). Escrow actions only ever change a few fields, so continuation
// datums are built by copying the on-chain datum and replacing those fields,
// never by re-encoding addresses by hand.
import { Data } from "@evolution-sdk/evolution";

export const State = {
  FundsLocked: 0n,
  ResultSubmitted: 1n,
  RefundRequested: 2n,
  Disputed: 3n,
  WithdrawAuthorized: 4n,
  RefundAuthorized: 5n,
} as const;
export type StateName = keyof typeof State;

/** Redeemer constructor indexes, in `pub type Action` order. */
export const Action = {
  Withdraw: 0n,
  SetRefundRequested: 1n,
  AuthorizeWithdrawal: 2n,
  WithdrawRefund: 3n,
  WithdrawDisputed: 4n,
  SubmitResult: 5n,
  AuthorizeRefund: 6n,
} as const;

/** Datum field positions that escrow actions rewrite. */
export const Field = {
  resultHash: 11,
  sellerCooldownTime: 16,
  buyerCooldownTime: 17,
  state: 18,
} as const;

export function redeemer(action: Exclude<keyof typeof Action, "WithdrawDisputed">): Data.Data {
  return Data.constr(Action[action], []);
}

export function stateName(index: bigint): StateName {
  const entry = Object.entries(State).find(([, v]) => v === index);
  if (!entry) throw new Error(`unknown escrow state ${index}`);
  return entry[0] as StateName;
}

function asConstr(datum: Data.Data): Data.Constr {
  if (!(datum instanceof Data.Constr) || datum.fields.length !== 19) {
    throw new Error("not a 19-field vested_pay datum");
  }
  return datum;
}

/** Copy of `datum` with the given fields replaced. */
export function withFields(
  datum: Data.Data,
  changes: Partial<Record<keyof typeof Field, Data.Data>>,
): Data.Constr {
  const fields = [...asConstr(datum).fields];
  for (const [name, value] of Object.entries(changes)) {
    fields[Field[name as keyof typeof Field]] = value as Data.Data;
  }
  return Data.constr(0n, fields);
}

export function stateData(state: StateName): Data.Data {
  return Data.constr(State[state], []);
}
