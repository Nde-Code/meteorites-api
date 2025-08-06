import { Config, Meteorite } from "../types/types.ts";

export function normalizeString(str: string): string { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

export function isConfigValidWithMinValues(config: Config, rules: Partial<Record<keyof Config, number>>): boolean {

    for (const [key, minValue] of Object.entries(rules)) {

        const value = config[key as keyof Config];

        if (typeof value !== "number" || value < (minValue ?? 0)) return false;

    }

    return true;

}

function haversine(latitude_1: number, longitude_1: number, latitude_2: number, longitude_2: number) {

    const toRad: (x: number) => number = (x: number) => (x * Math.PI) / 180;

    const R: number = 6371; 
    
    const dLat: number = toRad(latitude_2 - latitude_1);

    const dLon: number = toRad(longitude_2 - longitude_1);

    const a: number = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latitude_1)) * Math.cos(toRad(latitude_2)) * Math.sin(dLon / 2) ** 2;

    const c: number = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;

}

export function filterByDate(results: Meteorite[], year: number | null, minYear: number | null, maxYear: number | null): Meteorite[] {
    
    return results.filter(m => {

        if (typeof m.year !== "string") return false;

        const y: number = parseInt(m.year);

        if (isNaN(y)) return false;

        if (year !== null) return y === year;

        if (minYear !== null && y < minYear) return false;

        if (maxYear !== null && y > maxYear) return false;

        return true;

    });

}

export function filterByMass(results: Meteorite[], mass: string | null, minMass: number | null, maxMass: number | null): Meteorite[] {
    
    return results.filter(m => {

        if (m.mass === undefined || m.mass === null) return false;

        const massVal: number = parseFloat(String(m.mass));

        if (isNaN(massVal)) return false;

        if (mass !== null) {

            const massFilterVal: number = parseFloat(mass);

            if (isNaN(massFilterVal)) return false; 
            
            if (massVal !== massFilterVal) return false;

        }

        if (minMass !== null && massVal < minMass) return false;

        if (maxMass !== null && massVal > maxMass) return false;

        return true;

    });

}

export function filterByLocation(results: Meteorite[], centerLat: number | null, centerLon: number | null, radius: number | null): Meteorite[] {
    
    if (centerLat === null || centerLon === null || radius === null) return results;

    if (isNaN(centerLat) || isNaN(centerLon) || isNaN(radius)) return results;

    return results.filter(m => {

        if (typeof m.latitude !== "string" || typeof m.longitude !== "string") return false;

        const latM: number = parseFloat(m.latitude);

        const lonM: number = parseFloat(m.longitude);

        if (isNaN(latM) || isNaN(lonM)) return false;

        return haversine(centerLat, centerLon, latM, lonM) <= radius;

    });

}

export function getRecclassDistribution(meteorites: Meteorite[]): Record<string, number> {

	const recclassCountMap: Record<string, number> = {};

	for (const m of meteorites) {

		if (!m.recclass) continue;

		const rec: string = m.recclass.trim();

		recclassCountMap[rec] = (recclassCountMap[rec] || 0) + 1;

	}

	const sorted: [string, number][] = Object.entries(recclassCountMap).sort((a, b) => b[1] - a[1]);

	const fullRecclassDistribution: Record<string, number> = {};

	for (const [rec, count] of sorted) {

		fullRecclassDistribution[rec] = count;

	}

	return fullRecclassDistribution;
    
}

export function getTrimmedParam(param: string | null | undefined): string | null {

    if (typeof param !== 'string') return null;

    const trimmed: string = param.trim();

    return (trimmed.length === 0) ? null : trimmed;

}

export function toNumber(value: string | null | undefined): number | null {

    if (typeof value !== 'string') return null;

    const trimmed: string = value.trim();

    if (trimmed.length === 0) return null;

    const n: number = Number(trimmed);

    return isNaN(n) ? null : n;

}
