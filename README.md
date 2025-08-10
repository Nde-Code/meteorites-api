# NASA Meteorites Landings API:

A RESTful API built with **TypeScript** and **Deno** to query and analyze the NASA Meteorites Landings dataset.

Normally, this dataset comes as a CSV file with over 40,000 entries. I've compiled and cleaned it into a JSON format (with ~30k of entries) to make it more useful and portable.

> You can found the dataset here and by: [NASA Open Data Portal](https://data.nasa.gov/dataset/meteorite-landings)

This API is used in some projects:

 - [https://nde-code.github.io/online/meteorites-map](https://nde-code.github.io/online/meteorites-map)

## 🚀 Features:   

- CORS: You're free to use the API in your website or any other project, but daily rate limits still apply.

- No sign-up, no credit card, or other personal information required.

- No logs are maintained to track user activity.

- Rate limiting implemented to prevent API abuse.

- GDPR compliant: IP addresses are hashed using `SHA-256` with a strong, secure key and stored for max a day.

- Data Purge: The `meteorite_data` stored in Firebase Realtime Database has been cleaned to remove incomplete records (e.g., missing location, ...).

- Accurate Search: You can apply multiple filters to tailor the request as precisely as needed.

- Written in TypeScript with Deno runtime.

## 📦 Installation & Setup:

### 0. Prerequisites:

- [Deno](https://deno.land/#installation) (v1.0+ recommended)

- [Firebase Realtime Database](https://firebase.google.com/products/realtime-database)

### 1. Clone the repo:

```bash
git clone https://github.com/Nde-Code/meteorites-api.git
cd meteorites-api
```

### 2. Environment Variables:

Create a `.env` file in the root folder with:

```env
FIREBASE_HOST_LINK="YOUR_FIREBASE_URL"
FIREBASE_HIDDEN_PATH="YOUR_SECRET_PATH"
HASH_KEY="THE_KEY_USED_TO_HASH_IPS"
```

* **FIREBASE\_URL & FIREBASE\_HIDDEN\_PATH:** Firebase database connection info. Make sure `"YOUR_SECRET_PATH"` **is strong, safe and secure**.
* **HASH\_KEY:** Key used for IP hashing in rate limiting.

### 3. Open the `config.ts` file to customize settings:

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

### 4. Create a Firebase Realtime Database to store the dataset:

1. Go to [firebase.google.com](https://firebase.google.com/) and create an account.  
   > _(If you already have a Google account, you're good to go.)_

2. Create a **project** and set up a `Realtime Database`.

   > 🔍 If you get stuck, feel free to check out the official [Firebase documentation](https://firebase.google.com/docs/build?hl=en), or search on Google, YouTube, etc.

3. Once your database is ready, go to the **`Rules`** tab and paste the following code in the editor:
```JSON
{
  
  "rules": {
    
    ".read": false,
      
    ".write": false,
      
    "YOUR_SECRET_PATH": {
      
      ".read": true, 
        
      ".write": false
      
    }
  
  }

}
```

Here is a brief summary of these rules:

| Rule               | Effect                                                  |
| ------------------ | ------------------------------------------------------- |
| `".read": false`   | ❌ **Default**: Deny read access to **entire database**  |
| `".write": false`  | ❌ **Default**: Deny write access to **entire database** |
| `YOUR_SECRET_PATH` | 🔓 Allows **read** access under that specific path only |
|                    | ❌ **Still denies write** access under that path         |

4. Upload the data: go to [data/meteorite_data.json](data/meteorite_data.json), take the line **2** and replace `meteorites_key` by `YOUR_SECRET_PATH`. In the end, upload you file on your firebase RTDB. **Be careful: this will erase everything in your database before loading the new data. If you have other items stored, please make a backup first !!** 

### 5. Run the server:

```bash
deno task dev
```

## 📚 API Endpoints:

You're welcome to use my public online instance: [https://meteorites-api.deno.dev/](https://meteorites-api.deno.dev/)

> By using this API, whether hosted on your own server or through its public online instance, you confirm that you have read and accepted all the information provided in the [README.md](https://github.com/Nde-Code/meteorites-api/blob/main/README.md) and in [privacy.md](https://github.com/Nde-Code/meteorites-api/blob/main/privacy.md)

#### Rate limits for each endpoint:

* **1 request every `config.RATE_LIMIT_INTERVAL_S` (1 with my instance) seconds per IP**

* **Maximum `config.MAX_READS_PER_DAY` (15 with my instance) requests per IP per day**

### 1. **[GET]** `/search`:

Search meteorites using various filters, including name, class, date, mass, and geographic location.

#### **Query Parameters:**

| Parameter     | Type   | Description                                                                |
| ------------- | ------ | -------------------------------------------------------------------------- |
| `recclass`    | string | Meteorite classification                                |
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

> Invalid, non-required parameters will be completely ignored.

#### **Response:**

* `200 OK`: Successful query with results

* `400 Bad Request`: Missing or invalid parameters

* `404 Not Found`: No meteorite data available

* `429 Too Many Requests`: Rate limit exceeded

#### **Example Request:**

```bash
curl "https://meteorites-api.deno.dev/search?minYear=1998&center_lat=45.0&center_long=5.0&radius=200"
```

#### **Example Response:**

```json
{
  "success": {
    "count": 1,
    "meteorites": [
      {
        "fall": "Fell",
        "id": "458",
        "latitude": "45.821330",
        "longitude": "6.015330",
        "mass": "252",
        "name": "Alby sur Chéran",
        "recclass": "Eucrite-mmict",
        "year": "2002"
      }
    ]
  }
}
```

### 2. **[GET]** `/get`:

Retrieve detailed information about a single meteorite by either its unique `id` or its exact `name`.

#### **Query Parameters:**

| Parameter | Type   | Description                                  |
| --------- | ------ | --------------------------------------------|
| `id`      | string | Unique identifier of the meteorite          |
| `name`    | string | Exact name of the meteorite (case-insensitive, normalized) |

**Note:**  

- You **must provide either** `id` **or** `name`. Providing both parameters simultaneously will result in an error. If neither is provided, the request will be rejected.

#### **Response:**

* `200 OK`: Meteorite found and returned  

* `400 Bad Request`: Missing both parameters or both provided  

* `404 Not Found`: No meteorite matches the given identifier  

* `429 Too Many Requests`: Rate limit exceeded (per second or daily)

#### **Example Requests:**

Get meteorite by `id`:

```bash
curl "https://meteorites-api.deno.dev/get?id=12345"
````

Get meteorite by `name`:

```bash
curl "https://meteorites-api.deno.dev/get?name=Kopjes%20Vlei"
```

#### **Example Response:**

```json
{
  "success": {
    "meteorite": {
      "fall": "Found",
      "id": "12345",
      "latitude": "-29.300000",
      "longitude": "21.150000",
      "mass": "13600",
      "name": "Kopjes Vlei",
      "recclass": "Iron, IIAB",
      "year": "1914"
    }
  }
}
```

### 3. **[GET]** `/random`:

Get a random selection of meteorites.

Returns a randomly selected subset of meteorites, limited by a configurable maximum.

#### **Query Parameters:**

| Parameter | Type   | Description                                                                                                                                    |
| --------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `count`   | number | Number of random meteorites to return. Defaults to `config.DEFAULT_RANDOM_NUMBER_OF_METEORITES`. Cannot exceed `config.MAX_RANDOM_METEORITES`. |

> Invalid `count` parameters will be ignored, and the default value will be applied.

#### **Response:**

* `200 OK`: Successfully returns a random list of meteorites.

* `404 Not Found`: No meteorites data available.

* `429 Too Many Requests`: Rate limit exceeded.

If the requested `count` exceeds the maximum allowed, the result will be limited and a note will be included in the response.

#### **Example Request:**

```bash
curl "https://meteorites-api.deno.dev/random?count=3"
```

#### **Example Response:**

```json
{
  "success": {
    "count": 3,
    "meteorites": [
      {
        "fall": "Found",
        "id": "20816",
        "latitude": "-84.000000",
        "longitude": "168.000000",
        "mass": "8.9",
        "name": "Queen Alexandra Range 97358",
        "recclass": "L6",
        "year": "1997"
      },
      {
        "fall": "Found",
        "id": "1738",
        "latitude": "-76.716670",
        "longitude": "159.666670",
        "mass": "18.399999999999999",
        "name": "Allan Hills A78123",
        "recclass": "H5",
        "year": "1978"
      },
      {
        "fall": "Found",
        "id": "19196",
        "latitude": "-84.573660",
        "longitude": "162.249660",
        "mass": "5.4",
        "name": "Queen Alexandra Range 93107",
        "recclass": "H6",
        "year": "1993"
      }
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

### 4. **[GET]** `/stats`:

Retrieve aggregated statistics about the entire meteorite dataset.

Returns useful insights such as year ranges, mass stats, classification counts, and geolocation information.

#### **Fields Explained:**

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

> **Note:** Some meteorites are recorded with a mass of **0 grams**. This is not an error, but rather a reflection of specific characteristics—such as extreme alteration, fossilization, or missing recoverable fragments. It's important to recognize that these cases do occur. In such instances, the API automatically excludes entries with a mass of 0 from statistical analyses.

#### **Response:**

* `200 OK`: Statistics successfully returned

* `404 Not Found`: No meteorite data available

* `429 Too Many Requests`: Rate limit exceeded

#### **Example Request:**

```bash
curl "https://meteorites-api.deno.dev/stats"
```

#### **Returned JSON Structure:**

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

## 📄 License:

This project is licensed under the [Apache License v2.0](LICENSE).

## 📞 Contact:

Created and maintained by [Nde-Code](https://nde-code.github.io/).

> Feel free to reach out for questions or collaboration, or open an issue or pull request and I'll be happy to help.
