import { Meteorite, MeteoritesKey } from "../types/types.ts";

import { readInFirebaseRTDB } from "./read.ts";

import { config } from "../config.ts";

let meteoritesCache: Meteorite[] | null = null;

let meteoritesLoadingPromise: Promise<Meteorite[]> | null = null;

export async function loadMeteorites(): Promise<Meteorite[]> {

    if (meteoritesCache) return meteoritesCache;

    if (meteoritesLoadingPromise) return await meteoritesLoadingPromise;

    meteoritesLoadingPromise = (async () => {

        try {

            const data: MeteoritesKey | null = await readInFirebaseRTDB<MeteoritesKey>(config.FIREBASE_URL, config.FIREBASE_HIDDEN_PATH);

            meteoritesCache = data ? Object.values(data) : [];

            return meteoritesCache;

        } catch (_err) {

            return [];

        } finally {

            meteoritesLoadingPromise = null;
            
        }
        
    })();

    return await meteoritesLoadingPromise;
    
}
