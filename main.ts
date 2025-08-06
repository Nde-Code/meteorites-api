import {createJsonResponse} from './utilities/create_json.ts'

import { getIp, checkTimeRateLimit, checkDailyRateLimit, hashIp } from "./utilities/rate.ts";

import { loadMeteorites } from "./utilities/cache.ts";

import { Config, Meteorite, filters } from "./types/types.ts";

import { config } from "./config.ts";

import { normalizeString, isConfigValidWithMinValues, filterByDate, filterByLocation, filterByMass, getRecclassDistribution, getTrimmedParam, toNumber } from "./utilities/utils.ts";

async function handler(req: Request): Promise<Response> {

	const url: URL = new URL(req.url);

	const pathname: string = url.pathname;

	const hashedIP: string = await hashIp(getIp(req));

	const configMinValues: Partial<Record<keyof Config, number>> = {

		RATE_LIMIT_INTERVAL_S: 1,

		MAX_READS_PER_DAY: 5,

		IPS_PURGE_TIME_DAYS: 1,

		FIREBASE_TIMEOUT_MS: 6000, 

		MAX_RANDOM_METEORITES: 100,

		MAX_RETURNED_SEARCH_RESULTS: 100,

		MIN_RADIUS: 1,

		MAX_RADIUS: 1000,

		DEFAULT_RANDOM_NUMBER_OF_METEORITES: 100

	}

	if (!config.FIREBASE_URL || !config.FIREBASE_HIDDEN_PATH || !config.HASH_KEY) return createJsonResponse({ "error": "Your credentials are missing." }, 500);

	if (!isConfigValidWithMinValues(config, configMinValues)) return createJsonResponse({ "error": "Invalid configuration detected in your config.ts file. Please refer to the documentation."}, 500);

	if (!hashedIP || hashedIP.length !== 64) return createJsonResponse({ "error": "Unable to hash your IP but it's required for security." }, 403);

	if (req.method === "OPTIONS") {

		return new Response(null, {

			status: 204,

			headers: {

				"Access-Control-Allow-Origin": "*",

				"Access-Control-Allow-Methods": "GET, OPTIONS",

				"Access-Control-Allow-Headers": "Content-Type",

				"Access-Control-Max-Age": "86400"

			}

		});
		
	}

	if (req.method === "GET" && pathname === "/stats") {

		if (!(await checkTimeRateLimit(hashedIP))) return createJsonResponse({ "warning": `Rate limit exceeded: only 1 request per ${config.RATE_LIMIT_INTERVAL_S}s allowed.` }, 429);

		if (!(await checkDailyRateLimit(hashedIP))) return createJsonResponse({ "warning": `Rate limit exceeded: only ${config.MAX_READS_PER_DAY} request per day allowed.` }, 429);

		const meteorites: Meteorite[] = await loadMeteorites();

		if (!meteorites || meteorites.length === 0) return createJsonResponse({ error: "No meteorites data available." }, 404);

		let minYear: number | null = null;

		let maxYear: number | null = null;

		let minMass: number | null = null;

		let maxMass: number | null = null;

		let totalMass: number = 0;

  		let countMass: number = 0;

		const recclassSet: Set<string> = new Set();

		let countFell: number = 0;

		let countFound: number = 0;

		let totalCount: number = 0;

		for (const m of meteorites) {

			totalCount++;

			const y: number = parseInt(m.year?.trim?.());

			if (!isNaN(y)) {

				if (minYear === null || y < minYear) minYear = y;

				if (maxYear === null || y > maxYear) maxYear = y;

			}

			const mass: number = parseFloat(m.mass?.trim?.());

			if (!isNaN(mass) && mass > 0) {

				if (minMass === null || mass < minMass) minMass = mass;

				if (maxMass === null || mass > maxMass) maxMass = mass;

				totalMass += mass;

      			countMass++;

			}

			if (m.recclass) recclassSet.add(m.recclass.trim());

			if (m.fall?.trim().toLowerCase() === "fell") countFell++;

			if (m.fall?.trim().toLowerCase() === "found") countFound++;

		}

		return createJsonResponse({

			success: {

				"meteorites_count": totalCount,

				"years": [...new Set(meteorites.map((m) => parseInt(m.year)).filter(y => !isNaN(y)))].sort((a, b) => a - b),

				"min_year": minYear,

				"max_year": maxYear,

				"min_mass_g": minMass,

				"max_mass_g": maxMass,

				"avg_mass_g": countMass > 0 ? parseFloat((totalMass / countMass).toFixed(2)) : null,

				"recclasses": Array.from(recclassSet).sort(),

				"recclasses_distribution": getRecclassDistribution(meteorites),

				"geolocated_count": meteorites.filter(m => !isNaN(parseFloat(m.latitude)) && !isNaN(parseFloat(m.longitude))).length,

				"fall_counts": {

					fell: countFell,

					found: countFound,

				},

			}

		}, 200);

	}

	if (req.method === "GET" && pathname === "/random") {

		if (!(await checkTimeRateLimit(hashedIP))) return createJsonResponse({ "warning": `Rate limit exceeded: only 1 request per ${config.RATE_LIMIT_INTERVAL_S}s allowed.` }, 429);

		if (!(await checkDailyRateLimit(hashedIP))) return createJsonResponse({ "warning": `Rate limit exceeded: only ${config.MAX_READS_PER_DAY} request per day allowed.` }, 429);

		const countParam: string | null = url.searchParams.get("count");

		const meteorites: Meteorite[] = await loadMeteorites();

		if (!meteorites || meteorites.length === 0) return createJsonResponse({ "error": "No meteorites data available." }, 404);

		const requestedCount: number = countParam ? parseInt(countParam) : config.DEFAULT_RANDOM_NUMBER_OF_METEORITES;
		
		const exceededMax: boolean = requestedCount > config.MAX_RANDOM_METEORITES;

		const count: number = isNaN(requestedCount) || requestedCount <= 0 ? config.DEFAULT_RANDOM_NUMBER_OF_METEORITES : Math.min(requestedCount, config.MAX_RANDOM_METEORITES);

		const shuffled: Meteorite[] = meteorites.slice();

		for (let i = shuffled.length - 1; i > 0; i--) {

			const j: number = Math.floor(Math.random() * (i + 1));

			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];

		}

		const randomMeteorites: Meteorite[] = shuffled.slice(0, Math.min(count, shuffled.length));

		return createJsonResponse(

			{

				success: {

					count: randomMeteorites.length,

					meteorites: randomMeteorites,

					...(exceededMax && { note: `Requested count exceeded max limit. Returned ${config.MAX_RANDOM_METEORITES} items.` }),
				
				},

			}, 200
		
		);

	}

	if (req.method === "GET" && pathname === "/get") {

		if (!(await checkTimeRateLimit(hashedIP))) return createJsonResponse({ "warning": `Rate limit exceeded: only 1 request per ${config.RATE_LIMIT_INTERVAL_S}s allowed.` }, 429);

		if (!(await checkDailyRateLimit(hashedIP))) return createJsonResponse({ "warning": `Rate limit exceeded: only ${config.MAX_READS_PER_DAY} requests per day allowed.` }, 429);

		const query: URLSearchParams = url.searchParams;

		const id: string | null = getTrimmedParam(query.get("id"));

		const name: string | null = getTrimmedParam(query.get("name"));

		if (!id && !name) return createJsonResponse({ "error": "Please provide either 'id' or 'name' as a query parameter." }, 400);

		if (id && name) return createJsonResponse({ "error": "Please provide either 'id' or 'name', not both." }, 400);

		const meteorites: Meteorite[] = await loadMeteorites();

		let result: Meteorite | undefined;

		if (id) result = meteorites.find(m => m.id && m.id === id);
			
		else if (name) result = meteorites.find(m => m.name && normalizeString(m.name) === normalizeString(name));

		if (!result) return createJsonResponse({ "error": "No meteorite found for the given identifier." }, 404);

		return createJsonResponse({ "success": { "meteorite": result } }, 200);

	}

	if (req.method === "GET" && pathname === "/search") {

		if (!(await checkTimeRateLimit(hashedIP))) return createJsonResponse({ "warning": `Rate limit exceeded: only 1 request per ${config.RATE_LIMIT_INTERVAL_S}s allowed.` }, 429);

		if (!(await checkDailyRateLimit(hashedIP))) return createJsonResponse({ "warning": `Rate limit exceeded: only ${config.MAX_READS_PER_DAY} request per day allowed.` }, 429);

		const meteoritesData: Meteorite[] = await loadMeteorites();
		
		if (!meteoritesData || meteoritesData.length === 0) return createJsonResponse({ "error": "No meteorites data available." }, 404);

		const query: URLSearchParams = url.searchParams;

		const filters: filters = {

			recclass: getTrimmedParam(query.get("recclass")),

			fall: getTrimmedParam(query.get("fall")),

			year: toNumber(getTrimmedParam(query.get("year"))),

			minYear: toNumber(getTrimmedParam(query.get("minYear"))),

			maxYear: toNumber(getTrimmedParam(query.get("maxYear"))),

			mass: getTrimmedParam(query.get("mass")), 
			
			minMass: toNumber(getTrimmedParam(query.get("minMass"))),

			maxMass: toNumber(getTrimmedParam(query.get("maxMass"))),

			centerLat: toNumber(getTrimmedParam(query.get("center_lat"))),

			centerLon: toNumber(getTrimmedParam(query.get("center_long"))),

			radius: toNumber(getTrimmedParam(query.get("radius"))),

		};

		const anyGeoParamProvided: boolean = filters.centerLat !== null || filters.centerLon !== null || filters.radius !== null;

		const isInvalidCoord = (lat: number | null, lon: number | null, radius: number | null, minRadius: number, maxRadius: number): boolean => {
				
			return (lat === null || isNaN(lat) || lat < -90 || lat > 90 || lon === null || isNaN(lon) || lon < -180 || lon > 180 || radius === null || isNaN(radius) || radius <= 0 || radius < minRadius || radius > maxRadius);
			
		};

		if (anyGeoParamProvided) {

			if (isInvalidCoord(filters.centerLat, filters.centerLon, filters.radius, config.MIN_RADIUS, config.MAX_RADIUS)) return createJsonResponse({ error: "Missing required location parameters: center_lat, center_long, and radius." }, 400);
		
		}

		let results = Object.values(meteoritesData);

		if (filters.recclass) results = results.filter(m => typeof m.recclass === "string" && m.recclass.toLowerCase() === filters.recclass!.toLowerCase());

		if (filters.fall) results = results.filter(m => typeof m.fall === "string" && m.fall.toLowerCase() === filters.fall!.toLowerCase());

		results = filterByDate(results, filters.year, filters.minYear, filters.maxYear);

		results = filterByMass(results, filters.mass, filters.minMass, filters.maxMass);

		results = filterByLocation(results, filters.centerLat, filters.centerLon, filters.radius);

		results = results.slice(0, config.MAX_RETURNED_SEARCH_RESULTS);

		if (results.length === 0) return createJsonResponse({ success: { count: 0, meteorites: [], note: "No results found for the given criteria." } }, 200);

  		return createJsonResponse({ success: { count: results.length, meteorites: results } }, 200);
		
	}

	if (req.method === "GET" && pathname === "/") return createJsonResponse({ "success": "Welcome to the API root. Please refer to the documentation before sending the request."}, 200)

	return createJsonResponse({ "error": "The requested endpoint is invalid." }, 404);

}

Deno.serve(handler);
