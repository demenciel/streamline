<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ImageProxyController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\TMDBController;

// Import the articles data
$articles = json_decode(file_get_contents(resource_path('js/articles.js')), true);

Route::get('/', function () {
    return Inertia::render('Home');
});

Route::get('/privacy', function () {
    return Inertia::render('Privacy');
});

Route::get('/terms', function () {
    return Inertia::render('Terms');
});

Route::get('/contact', function () {
    return Inertia::render('Contact');
});

Route::get('/tmdb-image/{size}/{path}', [ImageProxyController::class, 'proxyTmdbImage'])
    ->where('path', '.*') // Allow any characters in the path
    ->name('tmdb.image');

Route::post('/newsletter/subscribe', [NewsletterController::class, 'store'])->name('newsletter.subscribe');


Route::get('/article/{id}', function ($id) {
    $articles = require base_path('app/Data/articles.php');
    $article = collect($articles)->firstWhere('id', $id);
    
    if (!$article) {
        abort(404);
    }

    return Inertia::render('Article', [
        'article' => $article
    ]);
})->name('article.show');

require __DIR__ . '/auth.php';
