import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Plus, Star, Calendar, Clock, Film, Tv, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// Utility function (can be moved)
const getImageUrl = (path, size = "w500") => {
    if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
    return `/tmdb-image/${size}/${path}`;
};

export function DetailsDialog({ isOpen, onClose, item, onAddToWatchlist, isAddedToWatchlist }) {
    const [details, setDetails] = useState(null);
    const [providers, setProviders] = useState(null);
    const [videos, setVideos] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userRegion, setUserRegion] = useState('US'); // Default to US
    const [regionName, setRegionName] = useState('United States'); // Human-readable region name

    const mediaType = item?.media_type || (item?.title ? 'movie' : 'tv');
    const itemId = item?.id;

    // Fetch user's region from API
    useEffect(() => {
        const fetchUserRegion = async () => {
            try {
                const response = await axios.get('/api/tmdb/localization');
                const region = response.data.region;
                setUserRegion(region);

                // Map region code to human-readable name (simplified version)
                const regionNames = {
                    'US': 'United States',
                    'GB': 'United Kingdom',
                    'CA': 'Canada',
                    'AU': 'Australia',
                    'FR': 'France',
                    'DE': 'Germany',
                    'IT': 'Italy',
                    'ES': 'Spain',
                    'BR': 'Brazil',
                    'MX': 'Mexico',
                    // Add more as needed
                };
                setRegionName(regionNames[region] || region);
            } catch (err) {
                console.error("Failed to fetch user region:", err);
                // Keep default values if fetch fails
            }
        };

        fetchUserRegion();
    }, []);

    useEffect(() => {
        if (isOpen && itemId && mediaType) {
            const fetchDetails = async () => {
                setIsLoading(true);
                setError(null);
                setDetails(null); // Clear previous details
                setProviders(null);
                setVideos(null);

                try {
                    const detailsUrl = `/api/tmdb/${mediaType}/${itemId}`;
                    const providersUrl = `/api/tmdb/${mediaType}/${itemId}/watch/providers?region=${userRegion}`;
                    const videosUrl = `/api/tmdb/${mediaType}/${itemId}/videos`;

                    // Fetch details, providers and videos
                    const [detailsRes, providersRes, videosRes] = await Promise.all([
                        axios.get(detailsUrl),
                        axios.get(providersUrl),
                        axios.get(videosUrl)
                    ]);

                    setDetails(detailsRes.data);
                    // TMDB returns providers nested under country codes
                    setProviders(providersRes.data.results?.[userRegion]);
                    setVideos(videosRes.data.results || []);

                } catch (err) {
                    console.error("Failed to fetch details:", err);
                    setError(err.response?.data?.message || 'Could not load details.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchDetails();
        } else {
            // Reset state if dialog is closed or item is invalid
            setDetails(null);
            setProviders(null);
            setVideos(null);
            setIsLoading(false);
            setError(null);
        }
    }, [isOpen, itemId, mediaType, userRegion]); // Re-fetch if region changes

    // Helper to safely get nested properties
    const getNested = (obj, path, defaultValue = null) => path.split('.').reduce((o, k) => (o || {})[k], obj) || defaultValue;

    const title = getNested(details, 'title') || getNested(details, 'name') || getNested(item, 'title') || getNested(item, 'name');
    const year = getNested(details, 'release_date')?.substring(0, 4) || getNested(details, 'first_air_date')?.substring(0, 4) || getNested(item, 'release_date')?.substring(0, 4) || getNested(item, 'first_air_date')?.substring(0, 4);
    const rating = details?.vote_average ? details.vote_average.toFixed(1) : item?.vote_average ? item.vote_average.toFixed(1) : null;
    const synopsis = getNested(details, 'overview');
    const cast = getNested(details, 'credits.cast', []).slice(0, 8); // Top 8 cast members
    const posterPath = getNested(details, 'poster_path') || getNested(item, 'poster_path');
    const backdropPath = getNested(details, 'backdrop_path');
    const runtime = getNested(details, 'runtime') || getNested(details, 'episode_run_time.0');
    const genres = getNested(details, 'genres', []);

    // Simplify provider access
    const flatProviders = getNested(providers, 'flatrate', []);
    const rentProviders = getNested(providers, 'rent', []);
    const buyProviders = getNested(providers, 'buy', []);

    // Get trailers and videos
    const trailers = videos?.filter(video =>
        video.site === 'YouTube' &&
        (video.type === 'Trailer' || video.type === 'Teaser')
    ) || [];

    // Get the main trailer (first official trailer, or first teaser if no trailer)
    const mainTrailer = trailers.find(video => video.type === 'Trailer') || trailers[0];

    // Format runtime to hours and minutes
    const formatRuntime = (minutes) => {
        if (!minutes) return null;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : ''}`;
    };

    // Create YouTube embed URL from video key
    const getYoutubeEmbedUrl = (key) => {
        return `https://www.youtube.com/embed/${key}?autoplay=0&rel=0`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => {
            onClose()
        }}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden rounded-xl">
                {/* Backdrop image header */}
                {backdropPath && (
                    <div className="relative w-full h-40 overflow-hidden">
                        <img
                            src={getImageUrl(backdropPath, 'w780') || "/placeholder.svg"}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 w-full p-4 text-white">
                            <Badge className="mb-2 bg-purple-600 hover:bg-purple-700">
                                {mediaType === 'movie' ? <Film className="h-3 w-3 mr-1" /> : <Tv className="h-3 w-3 mr-1" />}
                                {mediaType === 'movie' ? 'Movie' : 'TV Show'}
                            </Badge>
                            <h2 className="text-2xl font-bold">{title}</h2>
                            <div className="flex items-center gap-3 mt-1 text-sm">
                                {year && (
                                    <div className="flex items-center">
                                        <Calendar className="h-3.5 w-3.5 mr-1 opacity-70" />
                                        {year}
                                    </div>
                                )}
                                {runtime && (
                                    <div className="flex items-center">
                                        <Clock className="h-3.5 w-3.5 mr-1 opacity-70" />
                                        {formatRuntime(runtime)}
                                    </div>
                                )}
                                {rating && (
                                    <div className="flex items-center">
                                        <Star className="h-3.5 w-3.5 mr-1 fill-yellow-400 text-yellow-400" />
                                        {rating}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <ScrollArea className="max-h-[calc(90vh-13rem)]">
                    <div className="p-6">
                        {isLoading && <div className="p-6 text-center">Loading details...</div>}
                        {error && <div className="p-6 text-center text-red-600 bg-red-100 rounded">Error: {error}</div>}

                        {!isLoading && !error && details && (
                            <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    {trailers.length > 0 && (
                                        <TabsTrigger value="trailers">
                                            <Play className="h-3.5 w-3.5 mr-1.5" />
                                            Trailers
                                        </TabsTrigger>
                                    )}
                                    <TabsTrigger value="cast">Cast</TabsTrigger>
                                    <TabsTrigger value="watch">Where to Watch</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="mt-0">
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <div className="w-full sm:w-1/3 flex-shrink-0">
                                            <img
                                                src={getImageUrl(posterPath, 'w342') || "/placeholder.svg"}
                                                alt={title}
                                                className="w-full h-auto rounded-lg shadow-md"
                                            />

                                            {/* Add watch trailer button if trailer available */}
                                            {mainTrailer && (
                                                <Button
                                                    className="w-full mt-3 bg-red-600 hover:bg-red-700 flex items-center justify-center gap-1.5"
                                                    onClick={() => document.querySelector('[data-value="trailers"]')?.click()}
                                                >
                                                    <Play className="h-4 w-4" />
                                                    Watch Trailer
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            {!backdropPath && (
                                                <div className="mb-4">
                                                    <h2 className="text-2xl font-bold">{title}</h2>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                                        {year && (
                                                            <div className="flex items-center">
                                                                <Calendar className="h-3.5 w-3.5 mr-1 opacity-70" />
                                                                {year}
                                                            </div>
                                                        )}
                                                        {runtime && (
                                                            <div className="flex items-center">
                                                                <Clock className="h-3.5 w-3.5 mr-1 opacity-70" />
                                                                {formatRuntime(runtime)}
                                                            </div>
                                                        )}
                                                        {rating && (
                                                            <div className="flex items-center">
                                                                <Star className="h-3.5 w-3.5 mr-1 fill-yellow-400 text-yellow-400" />
                                                                {rating}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {genres.length > 0 && (
                                                <div className="mb-4 flex flex-wrap gap-2">
                                                    {genres.map(genre => (
                                                        <Badge key={genre.id} variant="outline" className="bg-gray-100">
                                                            {genre.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            <h3 className="text-lg font-semibold mb-2">Synopsis</h3>
                                            <DialogDescription className="text-sm text-gray-700 mb-4">
                                                {synopsis || 'No synopsis available.'}
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* New Trailers Tab */}
                                {trailers.length > 0 && (
                                    <TabsContent value="trailers" className="mt-0">
                                        <div className="space-y-4">
                                            {/* Main trailer (first one) */}
                                            <div>
                                                <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden">
                                                    <iframe
                                                        src={getYoutubeEmbedUrl(mainTrailer.key)}
                                                        className="absolute top-0 left-0 w-full h-full"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        title={`${title} - ${mainTrailer.name}`}
                                                    ></iframe>
                                                </div>
                                                <p className="mt-2 text-sm font-medium">{mainTrailer.name}</p>
                                            </div>

                                            {/* List of additional trailers */}
                                            {trailers.length > 1 && (
                                                <div className="mt-6">
                                                    <h3 className="text-lg font-medium mb-3">More videos</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {trailers.slice(1).map(video => (
                                                            <a
                                                                key={video.id}
                                                                href={`https://www.youtube.com/watch?v=${video.key}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-start gap-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                                            >
                                                                <div className="relative w-24 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                                                                    <img
                                                                        src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                                                                        alt={video.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                                                        <Play className="w-6 h-6 text-white" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium line-clamp-2 group-hover:text-purple-700">{video.name}</p>
                                                                    <p className="text-xs text-gray-500">{video.type}</p>
                                                                </div>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                )}

                                <TabsContent value="cast" className="mt-0">
                                    {cast.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {cast.map(actor => (
                                                <div key={actor.cast_id || actor.id} className="text-center">
                                                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                                                        <img
                                                            src={actor.profile_path ? getImageUrl(actor.profile_path, 'w185') : '/placeholder.svg?height=185&width=185'}
                                                            alt={actor.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <p className="font-medium text-sm">{actor.name}</p>
                                                    <p className="text-xs text-gray-500">{actor.character}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">No cast information available.</p>
                                    )}
                                </TabsContent>

                                <TabsContent value="watch" className="mt-0">
                                    <h3 className="text-lg font-semibold mb-3">Where to Watch ({regionName})</h3>

                                    {(flatProviders.length > 0 || rentProviders.length > 0 || buyProviders.length > 0) ? (
                                        <div className="space-y-6">
                                            {flatProviders.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-3 text-gray-600 flex items-center">
                                                        <Badge className="mr-2 bg-emerald-600">Stream</Badge>
                                                        Available with subscription
                                                    </h4>
                                                    <div className="flex flex-wrap gap-3">
                                                        {flatProviders.map(p => (
                                                            <div key={p.provider_id} className="text-center">
                                                                <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm border">
                                                                    <img
                                                                        src={getImageUrl(p.logo_path, 'w92') || "/placeholder.svg"}
                                                                        alt={p.provider_name}
                                                                        title={p.provider_name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <p className="text-xs mt-1">{p.provider_name}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {rentProviders.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-3 text-gray-600 flex items-center">
                                                        <Badge className="mr-2 bg-amber-500">Rent</Badge>
                                                        Available to rent
                                                    </h4>
                                                    <div className="flex flex-wrap gap-3">
                                                        {rentProviders.map(p => (
                                                            <div key={p.provider_id} className="text-center">
                                                                <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm border">
                                                                    <img
                                                                        src={getImageUrl(p.logo_path, 'w92') || "/placeholder.svg"}
                                                                        alt={p.provider_name}
                                                                        title={p.provider_name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <p className="text-xs mt-1">{p.provider_name}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {buyProviders.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-3 text-gray-600 flex items-center">
                                                        <Badge className="mr-2 bg-purple-600">Buy</Badge>
                                                        Available to purchase
                                                    </h4>
                                                    <div className="flex flex-wrap gap-3">
                                                        {buyProviders.map(p => (
                                                            <div key={p.provider_id} className="text-center">
                                                                <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm border">
                                                                    <img
                                                                        src={getImageUrl(p.logo_path, 'w92') || "/placeholder.svg"}
                                                                        alt={p.provider_name}
                                                                        title={p.provider_name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <p className="text-xs mt-1">{p.provider_name}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">No streaming information available for your region.</p>
                                    )}
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t">
                    <div className="flex w-full justify-between gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Close
                            </Button>
                        </DialogClose>
                        {item && (
                            <Button
                                onClick={() => !isAddedToWatchlist && onAddToWatchlist(item)}
                                disabled={isAddedToWatchlist || isLoading}
                                className={`flex items-center gap-1.5 ${isAddedToWatchlist ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                                title={isAddedToWatchlist ? 'Already in your watchlist' : 'Add to your watchlist'}
                            >
                                {isAddedToWatchlist ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        <span>In Watchlist</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        <span>Add to Watchlist</span>
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 
