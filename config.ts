import { Config } from "./types/types.ts";

export const config: Config = {

    FIREBASE_URL: Deno.env.get("FIREBASE_HOST_LINK") ?? "",

    FIREBASE_HIDDEN_PATH: Deno.env.get("FIREBASE_HIDDEN_PATH") ?? "",

    HASH_KEY: Deno.env.get("HASH_KEY") ?? "",

    RATE_LIMIT_INTERVAL_S: 1,

    MAX_READS_PER_DAY: 15,

    IPS_PURGE_TIME_DAYS: 1,

    FIREBASE_TIMEOUT_MS: 10000,

    MAX_RANDOM_METEORITES: 1000,

    MAX_RETURNED_SEARCH_RESULTS: 300,

    MIN_RADIUS: 1,

    MAX_RADIUS: 5000,

    DEFAULT_RANDOM_NUMBER_OF_METEORITES: 100

};