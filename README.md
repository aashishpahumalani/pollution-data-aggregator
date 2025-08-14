# Pollution Data Aggregator

A backend service that integrates pollution data from an external API and returns processed results of the most polluted cities by country, enriched with Wikipedia descriptions.

## Features

- **Data Integration**: Fetches pollution data from external mock API with authentication
- **Data Validation**: Filters out corrupted data and non-city entries using intelligent validation rules
- **Data Enrichment**: Adds Wikipedia descriptions for each valid city
- **Caching**: In-memory caching to respect API rate limits and improve performance
- **Error Handling**: Comprehensive error handling and logging
- **Production Ready**: Clean, maintainable code with proper structure

## API Endpoint

### GET /cities

Returns the most polluted cities sorted by pollution level (highest first) with Wikipedia descriptions and pagination metadata.

**Query Parameters:**

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of cities per page (default: 10)
- `country` (optional): Filter by country code (e.g., 'FR', 'US', 'CN')

**Example URLs:**

- `GET /cities` - Get first 10 cities
- `GET /cities?page=2&limit=5` - Get page 2 with 5 cities per page
- `GET /cities?country=FR&limit=20` - Get up to 20 French cities

**Response Format:**

```json
{
  "page": 1,
  "limit": 10,
  "total": 25,
  "cities": [
    {
      "name": "Paris",
      "country": "France",
      "pollution": 53.5,
      "description": "Paris is the capital and largest city of France..."
    },
    {
      "name": "Lyon",
      "country": "France",
      "pollution": 50.2,
      "description": "Lyon is a city in east-central France..."
    }
  ]
}
```

## Installation and Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd pollution-data-aggregator
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**
   Copy `.env` file and configure if needed:

   ```bash
   # The .env file is already configured with the provided credentials
   ```

4. **Run the application**

   ```bash
   # Production mode
   npm start

   # Development mode (with auto-reload)
   npm run dev
   ```

5. **Test the API**
   - Use the provided `test.rest` file with VS Code REST Client extension
   - Or use curl: `curl http://localhost:3000/cities`
   - Or visit `http://localhost:3000/health` for health check

## City Validation Logic

### How we determine if something is a city:

1. **City Name Normalization**:

   - **Accent Removal**: Converts "Lé Hávrê" → "Le Havre", "štrâsbourg" → "Strasbourg"
   - **Case Standardization**: "PaRIs" → "Paris", "TOULOUSE" → "Toulouse"
   - **Parenthetical Removal**: "Marseille (Zone)" → "Marseille"
   - **Character Cleaning**: Removes non-letter characters except spaces and hyphens
   - **Title Case Formatting**: Ensures proper capitalization for display

2. **Invalid Cities Caching**:

   - **Wikipedia Validation**: Cities are validated against Wikipedia's REST API
   - **Smart Caching**: Invalid cities are cached per country to avoid repeated API calls
   - **Cache Key Format**: `wikipedia_invalid_cities_{country}` stores arrays of invalid city names
   - **Performance Optimization**: Cached validation results prevent unnecessary Wikipedia requests
   - **Automatic Updates**: Cache is updated when new invalid cities are discovered

3. **Basic Validation**:

   - Must have a valid city name and pollution data
   - Minimum length requirements (2+ characters after normalization)
   - Must contain valid pollution measurements (numeric values within reasonable range)

4. **Name Pattern Validation**:

   - Filters out test/dummy data (e.g., "test", "sample", "lorem ipsum")
   - Excludes geographic features that aren't cities (e.g., "ocean", "mountain", "desert")
   - Validates character patterns (letters, spaces, hyphens, apostrophes only)
   - Rejects entries with excessive numbers or repeated characters

5. **Deduplication Process**:
   - **Post-Normalization**: Removes duplicate cities after name normalization
   - **Pollution-Based Selection**: Keeps the city record with the highest pollution level
   - **Exact Name Matching**: Uses normalized city names for duplicate detection

## Architecture

```
src/
├── controllers/        # Request handling logic
├── services/          # Business logic and external API integration
├── routes/            # Express route definitions
├── middleware/        # Custom middleware (error handling, etc.)
└── utils/             # Utility functions (caching, logging, validation)
```

## Key Components

- **Pollution Service**: Handles external API authentication and data fetching with retry logic
- **Wikipedia Service**: Fetches and caches city descriptions with invalid cities caching per country
- **City Validator**: Implements intelligent filtering rules with city name normalization and deduplication
- **Cache System**: In-memory caching with TTL for both valid descriptions and invalid cities lists
- **Authentication Service**: Manages Bearer token authentication with automatic refresh
- **Error Handler**: Comprehensive error handling with appropriate HTTP status codes

## Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)
- `API_BASE_URL`: Pollution data API base URL
- `API_USERNAME`: API authentication username
- `API_PASSWORD`: API authentication password
- `CACHE_TTL_MINUTES`: Cache time-to-live in minutes (default: 60)

## Limitations and Assumptions

1. **Rate Limiting**: Both the pollution API and Wikipedia API have rate limits. The application uses multi-level caching (valid descriptions + invalid cities per country) to minimize requests.

2. **Data Quality**: The validation rules include city name normalization and Wikipedia validation. Invalid cities are cached per country to improve performance on subsequent requests.

3. **Wikipedia Descriptions**: Cities are validated against Wikipedia's REST API. If a city is not found or invalid, it's cached to avoid repeated checks.

4. **Memory Usage**: Caching is done in memory for both valid descriptions and invalid cities lists. Cached data is lost on server restart.

5. **Country-Specific Validation**: Invalid cities are cached per country, allowing the same city name to be valid in one country and invalid in another.

6. **City Name Normalization**: The system normalizes city names (removes accents, standardizes case, removes parentheticals) which may occasionally merge distinct cities with similar names.

7. **Language Support**: Currently optimized for English Wikipedia entries and basic international character support.

## API Dependencies

- **Pollution Data API**: https://be-recruitment-task.onrender.com
- **Wikipedia API**: https://en.wikipedia.org/api/rest_v1

## Development

To run in development mode with auto-reload:

```bash
npm run dev
```

For debugging, set the log level in your environment:

```bash
LOG_LEVEL=debug npm run dev
```

## Testing

Use the provided `test.rest` file to test the API endpoints with the REST Client extension in VS Code, or use any HTTP client like curl or Postman.
