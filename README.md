# NASA Meteorites Landings API

A RESTful API built with **TypeScript** and **Deno** to query and analyze the NASA Meteorites Landings dataset.

This API is used in some projects:

 - [https://nde-code.github.io/online/meteorites-map](https://nde-code.github.io/online/meteorites-map)

> You can found the dataset here: [https://data.nasa.gov/dataset/meteorite-landings](https://data.nasa.gov/dataset/meteorite-landings)

## 🚀 Features  

- CORS: You're free to use the API in your website or any other project, but daily rate limits still apply.
- Rate limiting implemented to prevent API abuse.
- GDPR compliant: IP addresses are hashed using `SHA-256` with a strong, secure key and stored for max a day.
- Data Purge: The `meteorite_data` stored in Firebase Realtime Database has been cleaned to remove incomplete records (e.g., missing location, ...).
- Accurate Search: You can apply multiple filters to tailor the request as precisely as needed.

## 📦 Installation & Setup

### Prerequisites

- [Deno](https://deno.land/#installation) (v1.0+ recommended)

### Clone the repo

```bash
git clone https://github.com/Nde-Code/meteorites-api.git
cd meteorites-api
```

### Environment Variables

Create a `.env` file in the root folder with:

```env
FIREBASE_HOST_LINK="YOUR_FIREBASE_URL"
FIREBASE_HIDDEN_PATH="YOUR_SECRET_PATH"
HASH_KEY="THE_KEY_USED_TO_HASH_IPS"
```

* **FIREBASE\_URL & FIREBASE\_HIDDEN\_PATH:** Firebase database connection info. Make sure `"YOUR_SECRET_PATH"` **is strong, safe and secure**.
* **HASH\_KEY:** Key used for IP hashing in rate limiting.

### Open the `config.ts` file to customize settings:

```ts
export const config: Config = {

  FIREBASE_URL: Deno.env.get("FIREBASE_HOST_LINK") ?? "",

  FIREBASE_HIDDEN_PATH: Deno.env.get("FIREBASE_HIDDEN_PATH") ?? "",

  HASH_KEY: Deno.env.get("HASH_KEY") ?? "",

  RATE_LIMIT_INTERVAL_S: 1, // min: 1

  MAX_READS_PER_DAY: 15, // min: 5

  IPS_PURGE_TIME_DAYS: 1, // min: 1

  FIREBASE_TIMEOUT_MS: 10000, // min: 6000

  MAX_RANDOM_METEORITES: 1000, // min: 100

  MAX_RETURNED_SEARCH_RESULTS: 300, // min: 100

  MIN_RADIUS: 1, // min: 1

  MAX_RADIUS: 5000, // min: 1000

  DEFAULT_RANDOM_NUMBER_OF_METEORITES: 100 // min: 1000

};
```

- **FIREBASE_URL**, **FIREBASE_HIDDEN_PATH**, **HASH_KEY**: These are values read from the `.env` file, so please **do not modify them**.

- **RATE_LIMIT_INTERVAL_S** in [second]: This is the rate limit based on requests. Currently: one request per second.

- **MAX_READS_PER_DAY** in [day]: Daily reading rate limit. Currently: 15 reads per day.

- **IPS_PURGE_TIME_DAYS** in [day]: The number of days before purging the `Deno.kv` store that contains hashed IPs used for rate limiting. Currently: 1 day.

- **FIREBASE_TIMEOUT_MS** in [millisecond]: The timeout limit for HTTP requests to the Firebase Realtime Database. Currently: 10 seconds.

- **MAX_RANDOM_METEORITES**: The maximum number of meteorites retrieved from `/random`. Currently: 1000 meteorites.
 
- **MAX_RETURNED_SEARCH_RESULTS**: The maximum number of meteorites retrieved from `/search` when the result set is large.

- **MIN_RADIUS** & **MAX_RADIUS**: The minimum and maximum radius values allowed by the API to define the circular search area. Currently: `min = 1` and `max = 500`.

- **DEFAULT_RANDOM_NUMBER_OF_METEORITES**: In `/random`, if no `count` parameter is provided, this is the default number of meteorites retrieved. Currently: 100 meteorites.

### Ensure that you respect the `min` value specified in the comment; otherwise, you will get an error message with your configuration.

### Run the server

```bash
deno task dev
```

## 📚 API Endpoints

#### **Rate limits for each endpoint**

* **1 request every `config.RATE_LIMIT_INTERVAL_S` seconds per IP**
* **Maximum `config.MAX_READS_PER_DAY` requests per IP per day**

### 1. `/search`

Search meteorites using various filters, including name, class, date, mass, and geographic location.

#### **Query Parameters**

| Parameter     | Type   | Description                                                                |
| ------------- | ------ | -------------------------------------------------------------------------- |
| `name`        | string | Partial or full meteorite name (case-insensitive)                          |
| `recclass`    | string | Meteorite classification (case-insensitive)                                |
| `fall`        | string | Fall status (`Fell` or `Found`)                                            |
| `year`        | number | Exact year the meteorite fell or was found                                 |
| `minYear`     | number | Minimum year for filtering                                                 |
| `maxYear`     | number | Maximum year for filtering                                                 |
| `mass`        | number | Exact mass in grams                                                        |
| `minMass`     | number | Minimum mass in grams                                                      |
| `maxMass`     | number | Maximum mass in grams                                                      |
| `center_lat`  | number | Latitude of the center point for location filtering **(required with radius)** |
| `center_long` | number | Longitude of the center point **(required with radius)**                       |
| `radius`      | number | Radius in kilometers for location filtering **(required with center coords)**  |

#### **Response**

* `200 OK`: Successful query with results
* `400 Bad Request`: Missing or invalid coordinates
* `404 Not Found`: No meteorite data available
* `429 Too Many Requests`: Rate limit exceeded

#### **Example Request**

```http
GET /search?name=Allende&mass=1000&center_lat=20&center_long=-100&radius=500
```

#### **Example Response**

```json
{
  "success": {
    "count": 1,
    "meteorites": [
      {
        "name": "Allende",
        "mass": 2000,
        "year": 1969,
        "recclass": "CV3",
        ...
      }
    ]
  }
}
```

### 2. `/random`

Get a random selection of meteorites.

Returns a randomly selected subset of meteorites, limited by a configurable maximum.

#### **Query Parameters**

| Parameter | Type   | Description                                                                                                                                    |
| --------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `count`   | number | Number of random meteorites to return. Defaults to `config.DEFAULT_RANDOM_NUMBER_OF_METEORITES`. Cannot exceed `config.MAX_RANDOM_METEORITES`. |

#### **Response**

* `200 OK`: Successfully returns a random list of meteorites.
* `404 Not Found`: No meteorites data available.
* `429 Too Many Requests`: Rate limit exceeded.

If the requested `count` exceeds the maximum allowed, the result will be limited and a note will be included in the response.

#### **Example Request**

```http
GET /random?count=3
```

#### **Example Response**

```json
{
  "success": {
    "count": 3,
    "meteorites": [
      { "name": "Allende", "mass": 2000, "year": 1969, ... },
      { "name": "Chelyabinsk", "mass": 10000, "year": 2013, ... },
      { "name": "Murchison", "mass": 100, "year": 1969, ... }
    ]
  }
}
```

Or, if the `count` exceeded the maximum:

```json
{
  "success": {
    "count": 50,
    "meteorites": [ ... ],
    "note": "Requested count exceeded max limit. Returned 50 items."
  }
}
```

### 3. `/stats`

Retrieve aggregated statistics about the entire meteorite dataset.

Returns useful insights such as year ranges, mass stats, classification counts, and geolocation information.

#### **Response**

* `200 OK`: Statistics successfully returned
* `404 Not Found`: No meteorite data available
* `429 Too Many Requests`: Rate limit exceeded

#### **Returned JSON Structure**

```json
{
  "success": {
    "meteorites_count": 45700,
    "years": [1822, 1823, 1824, ...],
    "min_year": 861,
    "max_year": 2013,
    "min_mass_g": 0.1,
    "max_mass_g": 60000000,
    "avg_mass_g": 423.57,
    "recclasses": ["L6", "H5", "Iron, IAB-MG", ...],
    "recclasses_distribution": {
      "H5": 8123,
      "L6": 7054,
      ...
    },
    "geolocated_count": 39000,
    "fall_counts": {
      "fell": 1200,
      "found": 28000
    }
  }
}
```

#### **Fields Explained**

| Field                      | Type      | Description                                             |
| -------------------------- | --------- | ------------------------------------------------------- |
| `meteorites_count`         | number    | Total number of meteorites                              |
| `years`                    | number\[] | Sorted list of all available years in the dataset       |
| `min_year`, `max_year`     | number    | Earliest and latest year of meteorite fall/found        |
| `min_mass_g`, `max_mass_g` | number    | Smallest and largest mass in grams                      |
| `avg_mass_g`               | number    | Average mass in grams (rounded to 2 decimal places)     |
| `recclasses`               | string\[] | Sorted list of unique meteorite classifications         |
| `recclasses_distribution`  | object    | Frequency of each classification                        |
| `geolocated_count`         | number    | Number of meteorites with valid latitude and longitude  |
| `fall_counts`              | object    | Breakdown of meteorites by fall type: `fell` vs `found` |

> Some meteorites have a mass equal to 0. I've decided not to remove these entries, but keep in mind that it's possible to encounter them. In this case, the API excludes entries with a value of 0 from the statistics.

#### **Example Request**

```http
GET /stats
```

## 📄 License

This project is licensed under the [Apache License v2.0](LICENSE).

## 📞 Contact

Created and maintained by [Nde-Code](https://nde-code.github.io/).

> Feel free to reach out for questions or collaboration, or open an issue or pull request and I'll be happy to help!

*Happy meteorite hunting !* ☄️
