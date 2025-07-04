import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// initialize hono app
export const app = new Hono();
export type ApiRoutes = typeof apiRoutes;

// middlewares
app.use('*', logger());
app.use(
  '*',
  cors({
    credentials: true,
    origin: (origin) => origin,
    allowHeaders: ['Content-Type'],
  })
);

// Types for API responses
interface BusinessData {
  name: string;
  rating: number;
  reviews: number;
  address: string;
  phone?: string;
  website?: string;
  hours?: string;
  price?: string;
  data_id?: string;
  place_id?: string;
  distance?: number; // Distance in kilometers
  title?: string;
  thumbnail?: string;
  gps_coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface ReviewData {
  user: {
    name: string;
    thumbnail?: string;
    reviews?: number;
    local_guide?: boolean;
  };
  rating: number;
  date: string;
  snippet: string;
  likes?: number;
  response?: {
    date: string;
    snippet: string;
  };
}

interface CompetitorAnalysis {
  yourBusiness: BusinessData;
  topCompetitors: BusinessData[];
  comparison: {
    averageCompetitorRating: number;
    averageCompetitorReviews: number;
    yourRankingMessage: string;
    isGoodReputation: boolean;
    insights: string[];
  };
}

interface ReviewsResponse {
  placeInfo: BusinessData;
  reviews: ReviewData[];
  totalReviews: number;
}

// Helper function to search Google Maps via SerpAPI
async function searchGoogleMaps(
  query: string,
  location?: string
): Promise<{ local_results: BusinessData[] }> {
  const apiKey = process.env.SERP_API;
  if (!apiKey) {
    throw new Error('SERP_API key not found in environment variables');
  }

  // If location is provided, append it to the query instead of using ll parameter
  const searchQuery = location ? `${query} ${location}` : query;

  const params = new URLSearchParams({
    engine: 'google_maps',
    q: searchQuery,
    api_key: apiKey,
    type: 'search',
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `SerpAPI error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return await response.json();
}

// Helper function to search with Google Search engine (not Maps)
async function searchGoogleWeb(
  query: string,
  location?: string
): Promise<{ local_results: BusinessData[] }> {
  const apiKey = process.env.SERP_API;
  if (!apiKey) {
    throw new Error('SERP_API key not found');
  }

  const searchQuery = location ? `${query} ${location}` : query;
  const params = new URLSearchParams({
    engine: 'google',
    q: searchQuery,
    api_key: apiKey,
    google_domain: 'google.com',
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `SerpAPI Google error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return await response.json();
}

// Helper function to extract business info from Google web search
// biome-ignore lint: API response structure varies
function extractBusinessFromWebSearch(webResults: any): BusinessData | null {
  // Try to find knowledge graph or local results
  if (webResults.knowledge_graph) {
    const kg = webResults.knowledge_graph;
    return {
      name: kg.title,
      rating: kg.rating,
      reviews: kg.review_count,
      address: kg.address,
      phone: kg.phone,
      website: kg.website,
      place_id: kg.place_id,
      data_id: kg.data_id || `web_${kg.title.replace(/\s+/g, '_')}`,
    };
  }

  // Check for local results in web search
  if (webResults.local_results?.places) {
    return webResults.local_results.places[0];
  }

  return null;
}

// Enhanced search with multiple fallback strategies
async function searchWithFallbacks(
  businessName: string,
  location?: string
): Promise<{
  results: { local_results: BusinessData[] };
  searchMethod: string;
}> {
  const searchStrategies = [
    // Strategy 1: Exact name with location
    {
      query: businessName,
      location,
      method: 'exact_maps',
    },
    // Strategy 2: Simplified name (remove special chars) with location
    {
      query: businessName.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').trim(),
      location,
      method: 'simplified_maps',
    },
    // Strategy 3: Add "near me" if no location provided
    {
      query: location ? businessName : `${businessName} near me`,
      location: undefined,
      method: 'near_me_maps',
    },
    // Strategy 4: Try Google web search
    {
      query: businessName,
      location,
      method: 'google_web',
      useWebSearch: true,
    },
  ];

  for (const strategy of searchStrategies) {
    try {
      let results: { local_results: BusinessData[] };
      if (strategy.useWebSearch) {
        // biome-ignore lint: Sequential execution needed - strategies must be tried in order
        results = await searchGoogleWeb(strategy.query, strategy.location);
        const businessInfo = extractBusinessFromWebSearch(results);
        if (businessInfo) {
          return {
            results: { local_results: [businessInfo] },
            searchMethod: strategy.method,
          };
        }
      } else {
        results = await searchGoogleMaps(strategy.query, strategy.location);
        if (results.local_results && results.local_results.length > 0) {
          return { results, searchMethod: strategy.method };
        }
      }
    } catch (error) {
      // biome-ignore lint: Strategy failed, need to log for debugging
      console.error(`Strategy ${strategy.method} failed:`, error);
      // Continue to next strategy
    }
  }

  return { results: { local_results: [] }, searchMethod: 'none' };
}

// Helper function to get detailed business reviews
async function getBusinessReviews(dataId: string): Promise<{
  place_info: BusinessData;
  reviews: ReviewData[];
}> {
  const apiKey = process.env.SERP_API;
  if (!apiKey) {
    throw new Error('SERP_API key not found');
  }

  const params = new URLSearchParams({
    engine: 'google_maps_reviews',
    data_id: dataId,
    api_key: apiKey,
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `SerpAPI Reviews error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return await response.json();
}

// Helper function to calculate distance between two GPS coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

// Helper function to generate competitor search query
function generateCompetitorSearchQuery(
  businessName: string,
  businessLocation: string,
  businessAddress: string
): string {
  let location = businessLocation;
  if (!location && businessAddress) {
    const addressParts = businessAddress.split(',');
    if (addressParts.length > 1) {
      location = addressParts.at(-2)?.trim() || '';
    }
  }
  const lowerName = businessName.toLowerCase();
  const searchLocation = location || businessAddress || 'near me';

  // Mapping of business type keywords to competitor queries
  const typeMappings = [
    {
      keywords: ['starbucks', 'coffee', 'cafe'],
      query: `coffee shops cafes ${searchLocation}`,
    },
    {
      keywords: ['automotriz', 'auto', 'car', 'mechanic'],
      query: `auto shops car repair mechanics ${searchLocation}`,
    },
    {
      keywords: ['salon', 'salón', 'hair', 'beauty', 'barber'],
      query: `hair salons beauty salons barber shops ${searchLocation}`,
    },
    { keywords: ['pizza'], query: `pizza restaurants ${searchLocation}` },
    {
      keywords: ['restaurant', 'food'],
      query: `restaurants ${searchLocation}`,
    },
    {
      keywords: ['gym', 'fitness'],
      query: `gyms fitness centers ${searchLocation}`,
    },
    { keywords: ['hotel', 'motel'], query: `hotels motels ${searchLocation}` },
    { keywords: ['bar', 'pub'], query: `bars pubs ${searchLocation}` },
  ];

  for (const mapping of typeMappings) {
    if (mapping.keywords.some((kw) => lowerName.includes(kw))) {
      return mapping.query;
    }
  }

  // Default to searching for similar businesses in the area
  return `${businessName.split(' ')[0]} ${searchLocation}`;
}

// Helper function to filter and sort competitors
function filterAndSortCompetitors(
  competitors: BusinessData[],
  yourBusinessName: string,
  yourBusinessDataId?: string
): BusinessData[] {
  const filteredCompetitors = competitors.filter((business) => {
    // Handle both 'name' and 'title' fields from SerpAPI
    const businessName = business.name || business.title || '';
    return (
      businessName.toLowerCase() !== yourBusinessName.toLowerCase() &&
      business.data_id !== yourBusinessDataId &&
      business.rating &&
      business.reviews
    );
  });

  // Sort by rating and review count to get the best competitors
  filteredCompetitors.sort((a, b) => {
    const aScore = a.rating * Math.log(a.reviews + 1);
    const bScore = b.rating * Math.log(b.reviews + 1);
    return bScore - aScore;
  });

  return filteredCompetitors.slice(0, 4);
}

// Helper function to generate insights and comparison
function generateInsightsAndComparison(
  yourBusiness: BusinessData,
  topCompetitors: BusinessData[]
): {
  averageCompetitorRating: number;
  averageCompetitorReviews: number;
  yourRankingMessage: string;
  isGoodReputation: boolean;
  insights: string[];
} {
  const averageCompetitorRating =
    topCompetitors.reduce((sum, comp) => sum + comp.rating, 0) /
    topCompetitors.length;
  const averageCompetitorReviews =
    topCompetitors.reduce((sum, comp) => sum + comp.reviews, 0) /
    topCompetitors.length;

  const isGoodReputation =
    yourBusiness.rating >= 4.3 &&
    yourBusiness.rating >= averageCompetitorRating;

  const insights: string[] = [];
  let yourRankingMessage = '';

  if (isGoodReputation) {
    let ratingPercentile = 'above average';
    if (yourBusiness.rating >= 4.6) {
      ratingPercentile = 'top 10%';
    } else if (yourBusiness.rating >= 4.3) {
      ratingPercentile = 'top 25%';
    }
    yourRankingMessage = `Your ${yourBusiness.rating.toFixed(
      1
    )}-star rating puts you in the ${ratingPercentile}—here's how top businesses like yours stay #1.`;

    insights.push(
      `You're outperforming ${
        topCompetitors.filter((comp) => comp.rating < yourBusiness.rating)
          .length
      } out of ${topCompetitors.length} competitors`
    );
    insights.push(
      `Your rating is ${(yourBusiness.rating - averageCompetitorRating).toFixed(1)} points above the local average`
    );

    if (yourBusiness.reviews > averageCompetitorReviews) {
      insights.push(
        `You have ${Math.round(
          yourBusiness.reviews - averageCompetitorReviews
        )} more reviews than the average competitor`
      );
    }
  } else {
    const topCompetitor = topCompetitors[0];
    const reviewGap = topCompetitor.reviews - yourBusiness.reviews;
    const ratingGap = topCompetitor.rating - yourBusiness.rating;

    if (reviewGap > 0) {
      yourRankingMessage = `Your competitor ${topCompetitor.name || topCompetitor.title || 'Top competitor'} has ${reviewGap} more reviews than you`;
    } else {
      yourRankingMessage = `Your ${yourBusiness.rating.toFixed(
        1
      )}-star rating needs improvement to compete effectively`;
    }

    insights.push(
      `${
        topCompetitors.filter((comp) => comp.rating > yourBusiness.rating)
          .length
      } out of ${topCompetitors.length} competitors have higher ratings`
    );

    if (ratingGap > 0) {
      insights.push(
        `Top competitor has a ${ratingGap.toFixed(1)} point higher rating`
      );
    }

    if (reviewGap > 0) {
      insights.push(
        `You need ${reviewGap} more reviews to match your top competitor`
      );
    }
  }

  return {
    averageCompetitorRating,
    averageCompetitorReviews,
    yourRankingMessage,
    isGoodReputation,
    insights,
  };
}

// Helper: fetch and validate business
async function fetchAndValidateBusiness(
  businessName: string,
  location?: string
) {
  const { results: searchResults, searchMethod } = await searchWithFallbacks(
    businessName,
    location
  );
  if (
    !searchResults.local_results ||
    searchResults.local_results.length === 0
  ) {
    return {
      error: {
        error: 'No businesses found',
        suggestion: 'Try a more specific business name or add location details',
        debugInfo: {
          searchedFor: businessName,
          location: location || 'not specified',
          searchMethod,
          tip: 'For small businesses, try adding the full address or neighborhood',
        },
      },
      yourBusinessRaw: null,
      searchMethod,
    };
  }
  return {
    error: null,
    yourBusinessRaw: searchResults.local_results[0],
    searchMethod,
  };
}

// Helper: fetch and filter competitors
async function fetchAndFilterCompetitors(
  businessName: string,
  location: string,
  yourBusinessRaw: BusinessData
) {
  const competitorSearch = generateCompetitorSearchQuery(
    businessName,
    location || '',
    yourBusinessRaw.address || ''
  );
  const competitorResults = await searchGoogleMaps(competitorSearch);
  const topCompetitorsRaw = competitorResults.local_results
    ? filterAndSortCompetitors(
        competitorResults.local_results,
        yourBusinessRaw.name || yourBusinessRaw.title || '',
        yourBusinessRaw.data_id
      )
    : [];
  if (topCompetitorsRaw.length === 0) {
    return {
      error: {
        error: 'No competitors found in the area',
        suggestion:
          'This might be a unique business in the area, or try searching in a broader location',
        debugInfo: {
          originalSearch: businessName,
          competitorSearch,
          foundBusinesses: competitorResults.local_results?.length || 0,
          yourBusiness: {
            name: yourBusinessRaw.name || yourBusinessRaw.title,
            address: yourBusinessRaw.address,
          },
        },
      },
      topCompetitorsRaw: [],
      competitorSearch,
    };
  }
  return {
    error: null,
    topCompetitorsRaw,
    competitorSearch,
  };
}

// Helper: format business data
function formatBusinessData(yourBusinessRaw: BusinessData): BusinessData {
  return {
    name: yourBusinessRaw.name || yourBusinessRaw.title || 'Unknown',
    rating: yourBusinessRaw.rating || 0,
    reviews: yourBusinessRaw.reviews || 0,
    address: yourBusinessRaw.address || '',
    phone: yourBusinessRaw.phone,
    website: yourBusinessRaw.website,
    hours: yourBusinessRaw.hours,
    price: yourBusinessRaw.price,
    data_id: yourBusinessRaw.data_id,
    place_id: yourBusinessRaw.place_id,
    gps_coordinates: yourBusinessRaw.gps_coordinates,
  };
}

// Helper: format competitors data
function formatCompetitorsData(
  topCompetitorsRaw: BusinessData[],
  yourBusinessRaw: BusinessData
): BusinessData[] {
  return topCompetitorsRaw.map((competitor: BusinessData) => {
    const competitorData: BusinessData = {
      name: competitor.name || competitor.title || 'Unknown',
      rating: competitor.rating || 0,
      reviews: competitor.reviews || 0,
      address: competitor.address || '',
      phone: competitor.phone,
      website: competitor.website,
      hours: competitor.hours,
      price: competitor.price,
      data_id: competitor.data_id,
      place_id: competitor.place_id,
      gps_coordinates: competitor.gps_coordinates,
    };
    if (
      yourBusinessRaw.gps_coordinates &&
      competitor.gps_coordinates &&
      yourBusinessRaw.gps_coordinates.latitude &&
      yourBusinessRaw.gps_coordinates.longitude &&
      competitor.gps_coordinates.latitude &&
      competitor.gps_coordinates.longitude
    ) {
      competitorData.distance = calculateDistance(
        yourBusinessRaw.gps_coordinates.latitude,
        yourBusinessRaw.gps_coordinates.longitude,
        competitor.gps_coordinates.latitude,
        competitor.gps_coordinates.longitude
      );
    }
    return competitorData;
  });
}

// routes
const apiRoutes = app
  .basePath('/api')
  .get('/hello', (c) => {
    return c.json({
      message: 'Business Reputation Tracking API 🔥',
      date: new Date(),
      endpoints: {
        '/api/analyze-reputation':
          'POST - Analyze business reputation vs competitors',
        '/api/business-reviews/:dataId':
          'GET - Get detailed reviews for a business',
        '/api/search-business':
          'POST - Search for businesses by name and location',
      },
    });
  })

  .post('/analyze-reputation', async (c) => {
    try {
      const { businessName, location } = await c.req.json();
      if (!businessName) {
        return c.json({ error: 'Business name is required' }, 400);
      }
      // Step 1: Search for the specific business
      const { error: businessError, yourBusinessRaw } =
        await fetchAndValidateBusiness(businessName, location);
      if (businessError) {
        return c.json(businessError, 404);
      }
      // Step 2: Search for competitors
      const { error: competitorsError, topCompetitorsRaw } =
        await fetchAndFilterCompetitors(
          businessName,
          location || '',
          yourBusinessRaw
        );
      if (competitorsError) {
        return c.json(competitorsError, 404);
      }
      // Step 3: Format business and competitors data
      const yourBusiness = formatBusinessData(yourBusinessRaw);
      const topCompetitors = formatCompetitorsData(
        topCompetitorsRaw,
        yourBusinessRaw
      );
      // Step 4: Generate insights
      const comparison = generateInsightsAndComparison(
        yourBusiness,
        topCompetitors
      );
      const analysis: CompetitorAnalysis = {
        yourBusiness,
        topCompetitors,
        comparison,
      };
      return c.json(analysis);
    } catch (error) {
      return c.json(
        {
          error: 'Failed to analyze reputation',
          details: error instanceof Error ? error.message : 'Unknown error',
          suggestion: 'Check your SERP_API key and try again',
        },
        500
      );
    }
  })

  .get('/business-reviews/:dataId', async (c) => {
    try {
      const dataId = c.req.param('dataId');

      if (!dataId) {
        return c.json({ error: 'Data ID is required' }, 400);
      }

      const reviewsData = await getBusinessReviews(dataId);

      if (!reviewsData.reviews) {
        return c.json(
          {
            error: 'No reviews found for this business',
            suggestion: 'Check the data_id or try a different business',
          },
          404
        );
      }

      // Format the response
      const response: ReviewsResponse = {
        placeInfo: {
          name: reviewsData.place_info?.name || 'Unknown',
          rating: reviewsData.place_info?.rating || 0,
          reviews: reviewsData.place_info?.reviews || 0,
          address: reviewsData.place_info?.address || '',
        },
        reviews: reviewsData.reviews.slice(0, 10).map((review) => ({
          user: {
            name: review.user?.name || 'Anonymous',
            thumbnail: review.user?.thumbnail,
            reviews: review.user?.reviews,
            local_guide: review.user?.local_guide,
          },
          rating: review.rating || 0,
          date: review.date || '',
          snippet: review.snippet || '',
          likes: review.likes || 0,
          response: review.response
            ? {
                date: review.response.date,
                snippet: review.response.snippet,
              }
            : undefined,
        })),
        totalReviews: reviewsData.place_info?.reviews || 0,
      };

      return c.json(response);
    } catch (error) {
      return c.json(
        {
          error: 'Failed to get reviews',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  })

  .post('/search-business', async (c) => {
    try {
      const { query, location } = await c.req.json();

      if (!query) {
        return c.json({ error: 'Search query is required' }, 400);
      }

      const searchResults = await searchWithFallbacks(query, location);

      if (
        !searchResults.results.local_results ||
        searchResults.results.local_results.length === 0
      ) {
        return c.json(
          {
            error: 'No businesses found',
            suggestion: 'Try a different search term or location',
          },
          404
        );
      }

      // Format and return top 5 results
      const businesses = searchResults.results.local_results
        .slice(0, 5)
        .map((business) => ({
          name: business.name,
          rating: business.rating || 0,
          reviews: business.reviews || 0,
          address: business.address || '',
          phone: business.phone,
          website: business.website,
          hours: business.hours,
          price: business.price,
          data_id: business.data_id,
          place_id: business.place_id,
        }));

      return c.json({
        query,
        location,
        total_results: searchResults.results.local_results.length,
        businesses,
      });
    } catch (error) {
      return c.json(
        {
          error: 'Failed to search businesses',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  });

export default app;
