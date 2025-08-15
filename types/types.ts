export interface Config {

    FIREBASE_URL: string;

    FIREBASE_HIDDEN_PATH: string;

    HASH_KEY: string;

    RATE_LIMIT_INTERVAL_S: number;

    MAX_READS_PER_DAY: number;

    IPS_PURGE_TIME_DAYS: number;

    FIREBASE_TIMEOUT_MS: number;

    MAX_RANDOM_METEORITES: number;

    MAX_RETURNED_SEARCH_RESULTS: number;

    MIN_RADIUS: number;

    MAX_RADIUS: number;

    DEFAULT_RANDOM_NUMBER_OF_METEORITES: number;

}

export interface Meteorite {

    id: string;

    name: string;

    recclass: string;

    mass: string;   

    fall: string;

    year: string; 

    latitude: string;

    longitude: string;
    
}

export interface filters {

    recclass: string | null;

    fall: string | null;

    year: number | null;

    minYear: number | null;

    maxYear: number | null;

    mass: string | null;

    minMass: number | null;

    maxMass: number | null;

    centerLat: number | null;

    centerLon: number | null;

    radius: number | null;
    
}

export type MeteoritesDBFormat = Record<string, Meteorite>;