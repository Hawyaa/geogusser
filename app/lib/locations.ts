export interface Location {
  lat: number;
  lng: number;
  country: string;
  city?: string;
}

export const WORLD_LOCATIONS: Location[] = [
  // UK
  { lat: 51.5074, lng: -0.1278, country: "United Kingdom", city: "London" },
  { lat: 53.4808, lng: -2.2426, country: "United Kingdom", city: "Manchester" },
  { lat: 55.9533, lng: -3.1883, country: "United Kingdom", city: "Edinburgh" },
  { lat: 52.4862, lng: -1.8904, country: "United Kingdom", city: "Birmingham" },
  { lat: 51.4545, lng: -2.5879, country: "United Kingdom", city: "Bristol" },

  // Netherlands
  { lat: 52.3676, lng: 4.9041, country: "Netherlands", city: "Amsterdam" },
  { lat: 51.9244, lng: 4.4777, country: "Netherlands", city: "Rotterdam" },
  { lat: 52.0907, lng: 5.1214, country: "Netherlands", city: "Utrecht" },

  // Germany
  { lat: 52.5200, lng: 13.4050, country: "Germany", city: "Berlin" },
  { lat: 48.1351, lng: 11.5820, country: "Germany", city: "Munich" },
  { lat: 50.1109, lng: 8.6821, country: "Germany", city: "Frankfurt" },
  { lat: 53.5511, lng: 9.9937, country: "Germany", city: "Hamburg" },

  // France
  { lat: 48.8566, lng: 2.3522, country: "France", city: "Paris" },
  { lat: 45.7640, lng: 4.8357, country: "France", city: "Lyon" },
  { lat: 43.2965, lng: 5.3698, country: "France", city: "Marseille" },

  // USA
  { lat: 40.7128, lng: -74.0060, country: "USA", city: "New York" },
  { lat: 34.0522, lng: -118.2437, country: "USA", city: "Los Angeles" },
  { lat: 41.8781, lng: -87.6298, country: "USA", city: "Chicago" },
  { lat: 37.7749, lng: -122.4194, country: "USA", city: "San Francisco" },
  { lat: 47.6062, lng: -122.3321, country: "USA", city: "Seattle" },
  { lat: 25.7617, lng: -80.1918, country: "USA", city: "Miami" },
  { lat: 39.9526, lng: -75.1652, country: "USA", city: "Philadelphia" },
  { lat: 30.2672, lng: -97.7431, country: "USA", city: "Austin" },
  { lat: 39.7392, lng: -104.9903, country: "USA", city: "Denver" },

  // Canada
  { lat: 43.6532, lng: -79.3832, country: "Canada", city: "Toronto" },
  { lat: 49.2827, lng: -123.1207, country: "Canada", city: "Vancouver" },
  { lat: 45.5017, lng: -73.5673, country: "Canada", city: "Montreal" },

  // Japan
  { lat: 35.6762, lng: 139.6503, country: "Japan", city: "Tokyo" },
  { lat: 34.6937, lng: 135.5023, country: "Japan", city: "Osaka" },
  { lat: 35.0116, lng: 135.7681, country: "Japan", city: "Kyoto" },

  // Australia
  { lat: -33.8688, lng: 151.2093, country: "Australia", city: "Sydney" },
  { lat: -37.8136, lng: 144.9631, country: "Australia", city: "Melbourne" },
  { lat: -27.4698, lng: 153.0251, country: "Australia", city: "Brisbane" },

  // South Korea
  { lat: 37.5665, lng: 126.9780, country: "South Korea", city: "Seoul" },
  { lat: 35.1796, lng: 129.0756, country: "South Korea", city: "Busan" },

  // Brazil
  { lat: -23.5505, lng: -46.6333, country: "Brazil", city: "São Paulo" },
  { lat: -22.9068, lng: -43.1729, country: "Brazil", city: "Rio de Janeiro" },

  // Spain
  { lat: 40.4168, lng: -3.7038, country: "Spain", city: "Madrid" },
  { lat: 41.3851, lng: 2.1734, country: "Spain", city: "Barcelona" },

  // Italy
  { lat: 41.9028, lng: 12.4964, country: "Italy", city: "Rome" },
  { lat: 45.4642, lng: 9.1900, country: "Italy", city: "Milan" },

  // Sweden / Nordics
  { lat: 59.3293, lng: 18.0686, country: "Sweden", city: "Stockholm" },
  { lat: 55.6761, lng: 12.5683, country: "Denmark", city: "Copenhagen" },
  { lat: 60.1699, lng: 24.9384, country: "Finland", city: "Helsinki" },
  { lat: 59.9139, lng: 10.7522, country: "Norway", city: "Oslo" },

  // South Africa
  { lat: -33.9249, lng: 18.4241, country: "South Africa", city: "Cape Town" },
  { lat: -26.2041, lng: 28.0473, country: "South Africa", city: "Johannesburg" },

  // Switzerland
  { lat: 47.3769, lng: 8.5417, country: "Switzerland", city: "Zurich" },

  // Poland
  { lat: 52.2297, lng: 21.0122, country: "Poland", city: "Warsaw" },

  // Ethiopia (kept a few — best-effort)
  { lat: 9.0250, lng: 38.7469, country: "Ethiopia", city: "Addis Ababa" },
];

export function getRandomLocation(): Location {
  return WORLD_LOCATIONS[Math.floor(Math.random() * WORLD_LOCATIONS.length)];
}

export function getRandomLocations(count: number): Location[] {
  const shuffled = [...WORLD_LOCATIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
