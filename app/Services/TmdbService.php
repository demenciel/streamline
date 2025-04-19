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
        if (str_contains($endpoint, '/discover/') && !isset($params['region'])) {
            $params['region'] = $this->defaultRegion;
        }

        // Remove all caching logic and just make the direct API call
        $response = Http::withToken($this->apiKey)
            ->baseUrl($this->baseUrl)
            ->get($endpoint, $params);

        if ($response->failed()) {
            // Basic error handling, could be expanded
            Log::error('TMDB API Error: ' . $response->body());
            $response->throw(); // Throw an exception on failure
        }

        return $response->json();
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

    public function getUpcomingMovies(string $region): array
    {
        return $this->makeRequest('/movie/upcoming?language=en-US&page=1&region=' . $region);
    }
}
