'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Clock,
  Globe,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Search,
  Star,
} from 'lucide-react';
import { useState } from 'react';

const WEBSITE_REGEX = /^https?:\/\//;

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
  gps_coordinates?: {
    latitude: number;
    longitude: number;
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

export function ReputationTracker() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeReputation = async () => {
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze-reputation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze reputation');
      }

      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analyzeReputation();
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
            key={star}
          />
        ))}
        <span className="ml-1 font-medium text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const renderBusinessCard = (
    business: BusinessData,
    title: string,
    variant: 'default' | 'secondary' = 'default'
  ) => {
    return (
      <Card
        className={
          variant === 'secondary'
            ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800/50 dark:bg-orange-950/20'
            : 'border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/20'
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                variant === 'secondary' ? 'bg-orange-500' : 'bg-blue-500'
              }`}
            />
            {title}
            {business.distance !== undefined && variant === 'secondary' && (
              <Badge className="ml-auto text-xs" variant="outline">
                <Navigation className="mr-1 h-3 w-3" />
                {business.distance} km away
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="font-semibold text-lg">
            {business.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            {renderStars(business.rating)}
            <div className="flex items-center gap-2">
              <Badge className="ml-2" variant="outline">
                {business.reviews.toLocaleString()} reviews
              </Badge>
              {business.distance !== undefined && variant === 'secondary' && (
                <Badge className="text-xs" variant="secondary">
                  <Navigation className="mr-1 h-3 w-3" />
                  {business.distance} km
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 text-muted-foreground text-sm">
            {business.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{business.address}</span>
              </div>
            )}

            {business.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{business.phone}</span>
              </div>
            )}

            {business.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 flex-shrink-0" />
                <a
                  className="truncate text-blue-600 hover:underline dark:text-blue-400"
                  href={business.website}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {business.website.replace(WEBSITE_REGEX, '')}
                </a>
              </div>
            )}

            {business.hours && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>{business.hours}</span>
              </div>
            )}

            {business.price && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Price:</span>
                <Badge variant="outline">{business.price}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Business Search
          </CardTitle>
          <CardDescription>
            Enter a business name and location (e.g., "bobs coffee in north
            greenpoint")
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="query">Business Query</Label>
              <Input
                className="text-base"
                id="query"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., bobs coffee in north greenpoint, starbucks in manhattan, pizza near me"
                value={query}
              />
            </div>
            <Button
              className="w-full"
              disabled={loading || !query.trim()}
              type="submit"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Reputation...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze Reputation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="font-medium">Error:</span>
              {error}
            </div>
            {/* Show debugging info if available */}
            {analysis === null && error.includes('No businesses found') && (
              <div className="mt-4 space-y-2 text-red-600 text-sm dark:text-red-400">
                <p className="font-medium">Tips for finding your business:</p>
                <ul className="ml-2 list-inside list-disc space-y-1">
                  <li>Try adding the full address or neighborhood</li>
                  <li>Include the city name (e.g., "Lima" or "San Borja")</li>
                  <li>Remove special characters from the business name</li>
                  <li>Try searching for just the main part of the name</li>
                </ul>
                <p className="mt-3 text-muted-foreground text-xs">
                  Note: Smaller businesses may not always appear in search
                  results. We're working on improving this.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {analysis && (
        <div className="space-y-6">
          {/* Comparison Summary */}
          <Card
            className={`${
              analysis.comparison.isGoodReputation
                ? 'border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-950/20'
                : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800/50 dark:bg-yellow-950/20'
            }`}
          >
            <CardHeader>
              <CardTitle
                className={`${
                  analysis.comparison.isGoodReputation
                    ? 'text-green-800 dark:text-green-400'
                    : 'text-yellow-800 dark:text-yellow-400'
                }`}
              >
                Reputation Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`${
                  analysis.comparison.isGoodReputation
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                } mb-4 font-medium text-lg`}
              >
                {analysis.comparison.yourRankingMessage}
              </p>

              {/* Key Insights */}
              <div className="mb-4 space-y-2">
                <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
                  Key Insights
                </h4>
                {analysis.comparison.insights.map((insight) => (
                  <div className="flex items-start gap-2 text-sm" key={insight}>
                    <div
                      className={`mt-1.5 h-2 w-2 rounded-full ${
                        analysis.comparison.isGoodReputation
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>

              {/* Competition Metrics */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    Local Average Rating:
                  </span>
                  <span className="ml-2 font-medium">
                    {analysis.comparison.averageCompetitorRating.toFixed(1)}{' '}
                    stars
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Local Average Reviews:
                  </span>
                  <span className="ml-2 font-medium">
                    {Math.round(
                      analysis.comparison.averageCompetitorReviews
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Business */}
          <div>
            <h3 className="mb-4 font-semibold text-lg">Your Business</h3>
            {renderBusinessCard(
              analysis.yourBusiness,
              'Your Business',
              'default'
            )}
          </div>

          {/* Top Competitors */}
          <div>
            <h3 className="mb-4 font-semibold text-lg">
              Top Competitors ({analysis.topCompetitors.length})
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {analysis.topCompetitors.map((competitor, index) => (
                <div key={competitor.data_id || index}>
                  {renderBusinessCard(
                    competitor,
                    `#${index + 1} Competitor`,
                    'secondary'
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Competitive Positioning */}
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-400">
                Competitive Positioning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Your Position:
                    </span>
                    <span className="ml-2 font-medium">
                      {analysis.topCompetitors.filter(
                        (c) => c.rating < analysis.yourBusiness.rating
                      ).length + 1}{' '}
                      out of {analysis.topCompetitors.length + 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Rating Advantage:
                    </span>
                    <span
                      className={`ml-2 font-medium ${
                        analysis.yourBusiness.rating >=
                        analysis.comparison.averageCompetitorRating
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {analysis.yourBusiness.rating >=
                      analysis.comparison.averageCompetitorRating
                        ? '+'
                        : ''}
                      {(
                        analysis.yourBusiness.rating -
                        analysis.comparison.averageCompetitorRating
                      ).toFixed(1)}{' '}
                      pts
                    </span>
                  </div>
                </div>

                {/* Distance Analysis */}
                {analysis.topCompetitors.some(
                  (c) => c.distance !== undefined
                ) && (
                  <div className="border-t pt-3">
                    <h4 className="mb-2 font-medium text-sm">
                      Local Competition Distance
                    </h4>
                    <div className="space-y-1 text-xs">
                      {analysis.topCompetitors
                        .filter((c) => c.distance !== undefined)
                        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
                        .slice(0, 3)
                        .map((competitor) => (
                          <div
                            className="flex items-center justify-between"
                            key={competitor.data_id}
                          >
                            <span className="max-w-[200px] truncate">
                              {competitor.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge className="text-xs" variant="outline">
                                <Navigation className="mr-1 h-3 w-3" />
                                {competitor.distance} km
                              </Badge>
                              <span className="text-muted-foreground">
                                {competitor.rating.toFixed(1)}★
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-3">
                  <h4 className="mb-2 font-medium text-sm">
                    Rating Distribution
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span>
                        You ({analysis.yourBusiness.rating.toFixed(1)}★)
                      </span>
                    </div>
                    {analysis.topCompetitors.slice(0, 3).map((competitor) => (
                      <div
                        className="flex items-center gap-1"
                        key={competitor.data_id}
                      >
                        <div className="h-3 w-3 rounded-full bg-orange-500" />
                        <span>
                          {competitor.name.slice(0, 15)}... (
                          {competitor.rating.toFixed(1)}★)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
