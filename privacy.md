# Privacy Policy  

## Introduction:  
To be clear and transparent about what data this software uses and how it is handled.

## Information Collection and Use: 
### Rate limiting, Privacy and Security:

To implement a `rate limiting` system, this software works with your IP address. The IP is retrieved via:

```ts
export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("forwarded") ||
    "unknown"
  );
}
```

However, the IP is immediately hashed using `SHA-256`, combined with a `SALT` key (strong, secret, and secure) stored in the `.env` file. Your IP is **never logged** anywhere and is only stored in a memory database called [Deno KV](https://docs.deno.com/api/deno/~/Deno.Kv). This allows the software to retain information in memory, even if the project is restarted (e.g., due to a `Cold Start` on [Deno Deploy](https://deno.com/deploy)).

The IP is **never stored in any external database** or service. The `kv` database is **fully cleared every 24 hours**, which is why rate limiting is based on a **daily reset** (for better GDPR compliance), rather than on a weekly or monthly basis.

The **hashed IP** is the **only personal information** used by this project, and it's solely for security and abuse-prevention purposes. While fingerprinting could also be used, this project aims to remain as **privacy-friendly** as possible.

You can check the [rate.ts](utilities/rate.ts) file if you want to see how it works.

## Cookies: 
**No cookies**, **no analytics**, **no logs**, or **any other** data is collected by the project.

## Service Providers:  
The software uses third-party services to store data (the dataset of [NASA Open Data Portal](https://data.nasa.gov/dataset/meteorite-landings)). This is a `NoSQL` database called [Firebase Realtime Database](https://firebase.google.com/products/realtime-database).

You can read their privacy and terms here: [https://policies.google.com/privacy](https://policies.google.com/privacy) and [https://firebase.google.com/terms/](https://firebase.google.com/terms/)

## About My Online Instance with [Deno Deploy](https://deno.com/deploy):

Deno Deploy is a global, serverless platform used to host JavaScript and TypeScript applications.

This instance is hosted using Deno Deploy (although you're free to run your own).  
Please note that the hashed IP data stored in the KV database may transit and be stored **outside the European Union**, specifically in the **United States**.

Even though IP addresses are hashed with a strong secret and automatically deleted every 24 hours, this data might be subject to processing in jurisdictions with different privacy laws.

If you're concerned about this, consider self-hosting the project in an EU-only environment.

## Changes to This Privacy Policy:  
I may update this Privacy Policy from time to time. You are advised to review this page periodically for any changes.

Any updates will be posted on this page and will take effect immediately upon posting.

## Contact me:  
If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact me.

Contact Information:  
Email: *[nathan.debilloez@outlook.com]*  