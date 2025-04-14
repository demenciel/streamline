<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ImageProxyController extends Controller
{
    public function proxyTmdbImage(Request $request, $size, $path)
    {
        $url = "https://image.tmdb.org/t/p/{$size}/{$path}";
        
        $response = Http::get($url);
        
        if ($response->successful()) {
            return response($response->body())
                ->header('Content-Type', $response->header('Content-Type'))
                ->header('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        }
        
        return response()->noContent(404);
    }
} 