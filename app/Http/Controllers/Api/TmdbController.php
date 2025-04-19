<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\TmdbService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class TmdbController extends Controller
{
    protected TmdbService $tmdbService;

    public function __construct(Request $request, TmdbService $tmdbService)
    {
        // Pass request to service for locale detection
        $this->tmdbService = $tmdbService;

        // Check for explicit locale override in request
        if ($request->has('locale')) {
            $locale = $request->input('locale');
            $parts = explode('-', $locale);
            $language = $parts[0];
            $region = $parts[1] ?? null;

            $this->tmdbService->setLocale($language, $region);
        }
    }

    /**
     * Handle API request errors gracefully.
     */
    private function handleApiException(\Exception $e, string $method): JsonResponse
    {
        Log::error("Error in TmdbController@{$method}: " . $e->getMessage(), [
            'trace' => $e->getTraceAsString() // Optional: include stack trace for debugging
        ]);
        return response()->json(['error' => 'Failed to fetch data from TMDB', 'message' => $e->getMessage()], 500);
    }

    /**
     * Get current active localization settings
     */
    public function getLocalizationInfo(): JsonResponse
    {
        return response()->json([
            'region' => $this->tmdbService->getActiveRegion(),
            'language' => $this->tmdbService->getActiveLanguage(),
        ]);
    }

    public function discoverMovies(Request $request): JsonResponse
    {
        try {
            // Basic validation example (can be expanded with Form Requests)
            $validated = $request->validate([
                'sort_by' => 'sometimes|string',
                'with_genres' => 'sometimes|string',
                'primary_release_year' => 'sometimes|integer',
                'vote_average.gte' => 'sometimes|numeric|min:0|max:10',
                'with_watch_providers' => 'sometimes|string',
                'watch_region' => 'sometimes|string|size:2', // Expect ISO 3166-1 code
                'region' => 'sometimes|string|size:2', // General region parameter
                'page' => 'sometimes|integer|min:1',
            ]);

            // If watch_region is set but region isn't, use watch_region for region too
            if (isset($validated['watch_region']) && !isset($validated['region'])) {
                $validated['region'] = $validated['watch_region'];
            }

            // If no region is specified, use the service's default region
            if (!isset($validated['region'])) {
                $validated['region'] = $this->tmdbService->getActiveRegion();
            }

            // If region is set but watch_region isn't, use region for watch_region
            if (isset($validated['region']) && !isset($validated['watch_region']) && isset($validated['with_watch_providers'])) {
                $validated['watch_region'] = $validated['region'];
            }

            $data = $this->tmdbService->discoverMovies($validated);
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->handleApiException($e, __FUNCTION__);
        }
    }

    public function discoverTvShows(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'sort_by' => 'sometimes|string',
                'with_genres' => 'sometimes|string',
                'first_air_date_year' => 'sometimes|integer',
                'vote_average.gte' => 'sometimes|numeric|min:0|max:10',
                'with_watch_providers' => 'sometimes|string',
                'watch_region' => 'sometimes|string|size:2',
                'region' => 'sometimes|string|size:2', // General region parameter
                'page' => 'sometimes|integer|min:1',
            ]);

            // If watch_region is set but region isn't, use watch_region for region too
            if (isset($validated['watch_region']) && !isset($validated['region'])) {
                $validated['region'] = $validated['watch_region'];
            }

            // If no region is specified, use the service's default region
            if (!isset($validated['region'])) {
                $validated['region'] = $this->tmdbService->getActiveRegion();
            }

            // If region is set but watch_region isn't, use region for watch_region
            if (isset($validated['region']) && !isset($validated['watch_region']) && isset($validated['with_watch_providers'])) {
                $validated['watch_region'] = $validated['region'];
            }

            $data = $this->tmdbService->discoverTvShows($validated);
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->handleApiException($e, __FUNCTION__);
        }
    }

    public function searchMulti(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'query' => 'required|string|min:1',
                'page' => 'sometimes|integer|min:1',
                'region' => 'sometimes|string|size:2',
            ]);

            // Use validated region or default
            $region = $validated['region'] ?? $this->tmdbService->getActiveRegion();
            $page = $validated['page'] ?? 1;

            $data = $this->tmdbService->searchMulti($validated['query'], $page);
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->handleApiException($e, __FUNCTION__);
        }
    }

    public function getMovieDetails(string $id): JsonResponse
    {
        try {
            // validate id format
            if (!preg_match('/^[0-9]+$/', $id)) {
                throw new \Exception('Invalid movie ID');
            }
            $data = $this->tmdbService->getMovieDetails($id);
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->handleApiException($e, __FUNCTION__);
        }
    }

    public function getTvDetails(string $id): JsonResponse
    {
        try {
            // validate id format
            if (!preg_match('/^[0-9]+$/', $id)) {
                throw new \Exception('Invalid TV show ID');
            }
            $data = $this->tmdbService->getTvDetails($id);
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->handleApiException($e, __FUNCTION__);
        }
    }

    public function getMovieWatchProviders(string $id, Request $request): JsonResponse
    {
        try {
            // validate id format
            if (!preg_match('/^[0-9]+$/', $id)) {
                throw new \Exception('Invalid movie ID');
            }
            $region = $request->input('region', $this->tmdbService->getActiveRegion());
            $data = $this->tmdbService->getMovieWatchProviders($id);
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->handleApiException($e, __FUNCTION__);
        }
    }

    public function getTvWatchProviders(string $id, Request $request): JsonResponse
    {
        try {
            // validate id format
            if (!preg_match('/^[0-9]+$/', $id)) {
                throw new \Exception('Invalid TV show ID');
            }
            $region = $request->input('region', $this->tmdbService->getActiveRegion());
            $data = $this->tmdbService->getTvWatchProviders($id);
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->handleApiException($e, __FUNCTION__);
        }
    }

    public function getMovieGenres(): JsonResponse
    {
        try {
            $data = $this->tmdbService->getMovieGenres();
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->handleApiException($e, __FUNCTION__);
        }
    }

    public function getTvGenres(): JsonResponse
    {
        try {
            $data = $this->tmdbService->getTvGenres();
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->handleApiException($e, __FUNCTION__);
        }
    }

    /**
     * Get videos (including trailers) for a movie
     */
    public function getMovieVideos(string $id): JsonResponse
    {
        try {
            // validate id format
            if (!preg_match('/^[0-9]+$/', $id)) {
                throw new \Exception('Invalid movie ID');
            }
            $data = $this->tmdbService->getMovieVideos($id);
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->handleApiException($e, __FUNCTION__);
        }
    }

    /**
     * Get videos (including trailers) for a TV show
     */
    public function getTvVideos(string $id): JsonResponse
    {
        try {
            // validate id format
            if (!preg_match('/^[0-9]+$/', $id)) {
                throw new \Exception('Invalid TV show ID');
            }
            $data = $this->tmdbService->getTvVideos($id);
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->handleApiException($e, __FUNCTION__);
        }
    }

    public function getUpcomingMovies(Request $request): JsonResponse
    {
        try {
            $region = $request->input('region');
            $data = $this->tmdbService->getUpcomingMovies($region);
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->handleApiException($e, __FUNCTION__);
        }
    }
}
