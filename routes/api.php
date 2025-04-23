<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TmdbController;

// TMDB API Proxy Routes
// add rate limiting
Route::middleware('throttle:60,1')->group(function () {
    Route::prefix('tmdb')->group(function () {
        // Get current localization info
        Route::get('/localization', [TmdbController::class, 'getLocalizationInfo']);

        // Discover movies/TV shows
        Route::get('/discover/movie', [TmdbController::class, 'discoverMovies']);
        Route::get('/discover/tv', [TmdbController::class, 'discoverTvShows']);
        Route::get('/upcoming', [TmdbController::class, 'getUpcomingMovies']);
        Route::get('/trending/movie', [TmdbController::class, 'getTrendingMovies']);
        Route::get('/trending/tv', [TmdbController::class, 'getTrendingTvShows']);
        // Search
        Route::get('/search/multi', [TmdbController::class, 'searchMulti']);

        // Details
        Route::get('/movie/{id}', [TmdbController::class, 'getMovieDetails']);
        Route::get('/tv/{id}', [TmdbController::class, 'getTvDetails']);

        // Watch Providers
        Route::get('/movie/{id}/watch/providers', [TmdbController::class, 'getMovieWatchProviders']);
        Route::get('/tv/{id}/watch/providers', [TmdbController::class, 'getTvWatchProviders']);

        // Add other endpoints as needed, e.g., genres
        Route::get('/genres/movie', [TmdbController::class, 'getMovieGenres']);
        Route::get('/genres/tv', [TmdbController::class, 'getTvGenres']);

        // Videos/Trailers
        Route::get('/movie/{id}/videos', [TmdbController::class, 'getMovieVideos']);
        Route::get('/tv/{id}/videos', [TmdbController::class, 'getTvVideos']);
    });
});
