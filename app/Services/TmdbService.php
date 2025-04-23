<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\App;
use Illuminate\Http\Request;

class TmdbService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://api.themoviedb.org/3';
    protected int $cacheDuration = 3600; // Cache for 1 hour
    protected string $defaultLanguage = 'en-US';
    protected string $defaultRegion = 'US';

    public function __construct(Request $request = null)
    {
        $this->apiKey = config('services.tmdb.key');
        if (empty($this->apiKey)) {
            throw new \Exception('TMDB API Key not configured in services config or .env');
        }

        // Detect language and region from request if provided
        if ($request) {
            $this->detectLocaleFromRequest($request);
        }
    }

    /**
     * Detect and set locale settings based on request information
     */
    protected function detectLocaleFromRequest(Request $request): void
    {
        // Try to get the locale from the Accept-Language header
        $acceptLanguage = $request->header('Accept-Language');
        if ($acceptLanguage) {
            $locale = locale_accept_from_http($acceptLanguage);
            if ($locale) {
                $parts = explode('_', $locale);
                $language = strtolower($parts[0]);
                $region = isset($parts[1]) ? strtoupper($parts[1]) : $this->defaultRegion;

                $this->defaultLanguage = $language . '-' . $region;
                $this->defaultRegion = $region;
                return;
            }
        }

        // Fallback: Try to use the application locale
        $appLocale = App::getLocale();
        if ($appLocale && $appLocale !== 'en') {
            // Simple language mapping, could be expanded
            $parts = explode('-', $appLocale);
            $language = strtolower($parts[0]);
            $region = isset($parts[1]) ? strtoupper($parts[1]) : $this->defaultRegion;

            $this->defaultLanguage = $language . '-' . $region;
            $this->defaultRegion = $region;
        }
    }

    /**
     * Generic method to make requests to TMDB API with caching.
     */
    protected function makeRequest(string $endpoint, array $params = []): array
    {
        // Add default language unless already specified
        if (!isset($params['language'])) {
            $params['language'] = $this->defaultLanguage;
        }

        // Add default region for APIs that support it, if not already specified
        // TMDB uses 'region' parameter for regional preferences
        if (str_contains($endpoint, '/discover/') && !isset($params['region'])) {
            $params['region'] = $this->defaultRegion;
        }

        // Make cache key region-specific for region-dependent data
        $regionSuffix = '';
        if (isset($params['region']) || isset($params['watch_region'])) {
            $regionSuffix = '_region_' . ($params['region'] ?? $params['watch_region'] ?? $this->defaultRegion);
        }

        $cacheKey = 'tmdb_' . $endpoint . '_' . http_build_query($params) . $regionSuffix;

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($endpoint, $params) {
            $response = Http::withToken($this->apiKey)
                ->baseUrl($this->baseUrl)
                ->get($endpoint, $params);

            if ($response->failed()) {
                // Basic error handling, could be expanded
                Log::error('TMDB API Error: ' . $response->body());
                $response->throw(); // Throw an exception on failure
            }

            return $response->json();
        });
    }

    /**
     * Get the currently active region
     */
    public function getActiveRegion(): string
    {
        return $this->defaultRegion;
    }

    /**
     * Get the currently active language
     */
    public function getActiveLanguage(): string
    {
        return $this->defaultLanguage;
    }

    /**
     * Set region and language manually
     */
    public function setLocale(string $language, string $region = null): void
    {
        if ($region) {
            $this->defaultRegion = strtoupper($region);
            $this->defaultLanguage = strtolower($language) . '-' . $this->defaultRegion;
        } else {
            $parts = explode('-', $language);
            $this->defaultLanguage = $language;
            if (isset($parts[1])) {
                $this->defaultRegion = strtoupper($parts[1]);
            }
        }
    }

    public function discoverMovies(array $params = []): array
    {
        return $this->makeRequest('/discover/movie', $params);
    }

    public function discoverTvShows(array $params = []): array
    {
        return $this->makeRequest('/discover/tv', $params);
    }

    public function searchMulti(string $query, int $page = 1): array
    {
        return $this->makeRequest('/search/multi', [
            'query' => $query,
            'page' => $page,
            'region' => $this->defaultRegion, // Add region for better search results
        ]);
    }

    public function getMovieDetails(string $id): array
    {
        // Append details, credits and watch providers to the response
        return $this->makeRequest("/movie/{$id}", [
            'append_to_response' => 'credits,watch/providers',
            'watch_region' => $this->defaultRegion
        ]);
    }

    public function getTvDetails(string $id): array
    {
        // Append details, credits and watch providers to the response
        return $this->makeRequest("/tv/{$id}", [
            'append_to_response' => 'credits,watch/providers',
            'watch_region' => $this->defaultRegion
        ]);
    }

    public function getMovieWatchProviders(string $id): array
    {
        return $this->makeRequest("/movie/{$id}/watch/providers", [
            'watch_region' => $this->defaultRegion
        ]);
    }

    public function getTvWatchProviders(string $id): array
    {
        return $this->makeRequest("/tv/{$id}/watch/providers", [
            'watch_region' => $this->defaultRegion
        ]);
    }

    public function getMovieGenres(): array
    {
        return $this->makeRequest('/genre/movie/list');
    }

    public function getTvGenres(): array
    {
        return $this->makeRequest('/genre/tv/list');
    }

    /**
     * Get videos (including trailers) for a movie
     */
    public function getMovieVideos(string $id): array
    {
        return $this->makeRequest("/movie/{$id}/videos");
    }

    /**
     * Get videos (including trailers) for a TV show
     */
    public function getTvVideos(string $id): array
    {
        return $this->makeRequest("/tv/{$id}/videos");
    }

    public function getUpcomingMovies(string $region, string $language): array
    {
        // Cache key for all upcoming movies
        $allMoviesCacheKey = 'tmdb_all_upcoming_movies_' . $region;
        // Cache key for tracking shown movies
        $shownMoviesCacheKey = 'tmdb_shown_upcoming_movies_' . $region;

        // Get all movies (either from cache or API)
        $allMovies = Cache::remember($allMoviesCacheKey, $this->cacheDuration, function () use ($region, $language) {
            // Fetch multiple pages to have a larger pool of movies
            $allResults = [];
            for ($page = 1; $page <= 3; $page++) {
                $response = $this->makeRequest('/movie/upcoming?language=' . $language . '&page=' . $page . '&region=' . $region);
                if (isset($response['results']) && !empty($response['results'])) {
                    $allResults = array_merge($allResults, $response['results']);
                }
            }
            return ['results' => $allResults];
        });

        // Get previously shown movie IDs
        $shownMovieIds = Cache::get($shownMoviesCacheKey, []);

        // Filter out previously shown movies
        $availableMovies = array_filter($allMovies['results'] ?? [], function ($movie) use ($shownMovieIds) {
            return !in_array($movie['id'], $shownMovieIds);
        });

        // If we're running out of unseen movies (less than 5), reset the shown list
        if (count($availableMovies) < 5) {
            $shownMovieIds = [];
            $availableMovies = $allMovies['results'] ?? [];
            Cache::put($shownMoviesCacheKey, [], $this->cacheDuration);
        }

        // Take a random subset of the available movies (10-20 movies)
        $movieCount = min(count($availableMovies), rand(10, 20));
        if ($movieCount > 0) {
            shuffle($availableMovies);
            $selectedMovies = array_slice($availableMovies, 0, $movieCount);

            // Track which movies were shown
            $newShownMovieIds = array_merge($shownMovieIds, array_column($selectedMovies, 'id'));
            Cache::put($shownMoviesCacheKey, $newShownMovieIds, $this->cacheDuration);
            // remove duplicates from the array
            $selectedMovies = array_unique($selectedMovies, SORT_REGULAR);
            $selectedMovies = array_slice($selectedMovies, 0, 5);
            return ['results' => $selectedMovies];
        }

        // Fallback: if something went wrong, return a subset of all movies
        shuffle($allMovies['results']);
        return ['results' => array_slice($allMovies['results'], 0, 10)];
    }

    public function getTrendingMovies(string $region, string $language): array
    {
        // Cache key for all trending movies
        $allMoviesCacheKey = 'tmdb_all_trending_movies_' . $region;
        // Cache key for tracking shown movies
        $shownMoviesCacheKey = 'tmdb_shown_trending_movies_' . $region;

        // Get all movies (either from cache or API)
        $allMovies = Cache::remember($allMoviesCacheKey, $this->cacheDuration, function () use ($region, $language) {
            // Fetch multiple pages to have a larger pool of movies
            $allResults = [];
            for ($page = 1; $page <= 3; $page++) {
                $response = $this->makeRequest('/movie/popular?language=' . $language . '&page=' . $page . '&region=' . $region);
                if (isset($response['results']) && !empty($response['results'])) {
                    $allResults = array_merge($allResults, $response['results']);
                }
            }
            return ['results' => $allResults];
        });

        // Get previously shown movie IDs
        $shownMovieIds = Cache::get($shownMoviesCacheKey, []);

        // Filter out previously shown movies
        $availableMovies = array_filter($allMovies['results'] ?? [], function ($movie) use ($shownMovieIds) {
            return !in_array($movie['id'], $shownMovieIds);
        });

        // If we're running out of unseen movies (less than 5), reset the shown list
        if (count($availableMovies) < 5) {
            $shownMovieIds = [];
            $availableMovies = $allMovies['results'] ?? [];
            Cache::put($shownMoviesCacheKey, [], $this->cacheDuration);
        }

        // Take a random subset of the available movies (10-20 movies)
        $movieCount = min(count($availableMovies), rand(10, 20));
        if ($movieCount > 0) {
            shuffle($availableMovies);
            $selectedMovies = array_slice($availableMovies, 0, $movieCount);

            // Track which movies were shown
            $newShownMovieIds = array_merge($shownMovieIds, array_column($selectedMovies, 'id'));
            Cache::put($shownMoviesCacheKey, $newShownMovieIds, $this->cacheDuration);
            // remove duplicates from the array
            $selectedMovies = array_unique($selectedMovies, SORT_REGULAR);
            $selectedMovies = array_slice($selectedMovies, 0, 5);
            // get the movies providers
            $selectedMovies = array_map(function ($movie) {
                $movie['providers'] = $this->getMovieWatchProviders($movie['id']);
                return $movie;
            }, $selectedMovies);
            return ['results' => $selectedMovies];
        }

        // Fallback: if something went wrong, return a subset of all movies
        shuffle($allMovies['results']);
        $allMovies['results'] = array_map(function ($movie) {
            $movie['providers'] = $this->getMovieWatchProviders($movie['id']);
            return $movie;
        }, $allMovies['results']);
        return ['results' => array_slice($allMovies['results'], 0, 5)];
    }

    public function getTrendingTvShows(string $region, string $language): array
    {
        // Cache key for all trending TV shows
        $allTvShowsCacheKey = 'tmdb_all_trending_tv_shows_' . $region;
        // Cache key for tracking shown TV shows
        $shownTvShowsCacheKey = 'tmdb_shown_trending_tv_shows_' . $region;

        // Get all TV shows (either from cache or API)
        $allTvShows = Cache::remember($allTvShowsCacheKey, $this->cacheDuration, function () use ($region, $language) {
            // Fetch multiple pages to have a larger pool of TV shows
            $allResults = [];
            for ($page = 1; $page <= 3; $page++) {
                $response = $this->makeRequest('/tv/popular?language=' . $language . '&page=' . $page . '&region=' . $region);
                if (isset($response['results']) && !empty($response['results'])) {
                    $allResults = array_merge($allResults, $response['results']);
                }
            }
            return ['results' => $allResults];
        });

        // Get previously shown TV show IDs 
        $shownTvShowIds = Cache::get($shownTvShowsCacheKey, []);

        // Filter out previously shown TV shows
        $availableTvShows = array_filter($allTvShows['results'] ?? [], function ($tvShow) use ($shownTvShowIds) {
            return !in_array($tvShow['id'], $shownTvShowIds);
        });

        // If we're running out of unseen TV shows (less than 5), reset the shown list
        if (count($availableTvShows) < 5) {
            $shownTvShowIds = [];
            $availableTvShows = $allTvShows['results'] ?? [];
            Cache::put($shownTvShowsCacheKey, [], $this->cacheDuration);
        }

        // Take a random subset of the available TV shows (10-20 shows)
        $tvShowCount = min(count($availableTvShows), rand(10, 20));
        if ($tvShowCount > 0) {
            shuffle($availableTvShows);
            $selectedTvShows = array_slice($availableTvShows, 0, $tvShowCount);

            // Track which TV shows were shown
            $newShownTvShowIds = array_merge($shownTvShowIds, array_column($selectedTvShows, 'id'));
            Cache::put($shownTvShowsCacheKey, $newShownTvShowIds, $this->cacheDuration);
            // remove duplicates from the array
            $selectedTvShows = array_unique($selectedTvShows, SORT_REGULAR);
            $selectedTvShows = array_slice($selectedTvShows, 0, 5);
            return ['results' => $selectedTvShows];
        }

        // Fallback: if something went wrong, return a subset of all TV shows
        shuffle($allTvShows['results']);
        return ['results' => array_slice($allTvShows['results'], 0, 5)];
    }
}
