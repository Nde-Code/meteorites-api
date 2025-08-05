import { Meteorite, MeteoritesKey } from "../types/types.ts";

import { readInFirebaseRTDB } from "./read.ts";

import { config } from "../config.ts";

let meteoritesCache: Meteorite[] | null = null;

let meteoritesLoadingPromise: Promise<Meteorite[]> | null = null;

export async function loadMeteorites(): Promise<Meteorite[]> {

    if (meteoritesCache) return meteoritesCache;

    if (meteoritesLoadingPromise) return await meteoritesLoadingPromise;

    meteoritesLoadingPromise = readInFirebaseRTDB<MeteoritesKey>(config.FIREBASE_URL, config.FIREBASE_HIDDEN_PATH)
        
        .then((data) => { return meteoritesCache = data ? Object.values(data) : [] })

        .catch(() => []) 

        .finally(() => { meteoritesLoadingPromise = null; });

    return await meteoritesLoadingPromise;

}
