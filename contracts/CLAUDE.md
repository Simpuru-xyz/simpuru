# contracts

Escrow deployment on Cardano preprod. Owner: @ghozzza.

- Our deployment of the Masumi `vested_pay` V2 validator with **our arbiter key** (#3).
- Script address, script hash and parameters go in `deployments/preprod.json`; `README.md`
  explains how to reproduce the deployment.
- Reference-script UTxO to cut fees (#18), address recorded in the same file.
- Locks at our address are not visible to Masumi tooling; that is expected.
- Preprod only. No keys or mnemonics in this folder.

## Original work only

No code, names, assets, links or wording copied from other projects, and no other project's name
in code, comments, file names or commit messages. Check `git diff --cached` before every commit.
See the root `CLAUDE.md`.
