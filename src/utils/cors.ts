export function createCORSHeaders(origin: string = "*") {
    return {
      "Access-Control-Allow-Origin": origin, // Bisa diganti dengan domain frontend
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    };
  }
  