import { bangs as hotBangs } from "../generated/bangs-hot";
import { BangCatalog } from "./bang-index";
import type { CustomBang } from "./types";

let fullDataPromise: Promise<Awaited<ReturnType<typeof importFullData>>> | null =
  null;

async function importFullData() {
  return import("../generated/bangs-full");
}

export function createAppCatalog(customBangs: readonly CustomBang[]): BangCatalog {
  return new BangCatalog(hotBangs, customBangs, async () => {
    if (!fullDataPromise) fullDataPromise = importFullData();
    return (await fullDataPromise).bangs;
  });
}

export { hotBangs };
