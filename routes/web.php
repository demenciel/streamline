<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ImageProxyController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Home');
});

Route::get('/tmdb-image/{size}/{path}', [ImageProxyController::class, 'proxyTmdbImage'])
    ->where('path', '.*') // Allow any characters in the path
    ->name('tmdb.image');

require __DIR__.'/auth.php';
