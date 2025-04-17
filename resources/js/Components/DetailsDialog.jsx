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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Plus, Star, Calendar, Clock, Film, Tv, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XMarkIcon } from '@heroicons/react/24/outline';

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
        return () => {
            setDetails(null);
            setProviders(null);
            setVideos(null);
            setIsLoading(false);
            setError(null);
            setActiveTab('overview');
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
    const [activeTab, setActiveTab] = useState('overview');
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
        <Dialog open={isOpen} onOpenChange={() => onClose()} closeButton={false}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden rounded-xl bg-gray-900 border-gray-800">
                {/* Add a custom close button positioned absolute in the corner */}
                <DialogClose asChild>
                    <Button variant="outline" className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white/70 hover:text-white transition-colors">
                        <XMarkIcon className=" text-white fill-white" />
                    </Button>
                </DialogClose>

                {/* Backdrop image header */}
                {backdropPath && (
                    <div className="relative w-full h-40 overflow-hidden">
                        <img
                            src={getImageUrl(backdropPath, 'w780') || "/placeholder.svg"}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-black/50 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 w-full p-4 text-white">
                            <Badge className="mb-2 bg-purple-900 hover:bg-purple-800 text-white">
                                {mediaType === 'movie' ? <Film className="h-3 w-3 mr-1" /> : <Tv className="h-3 w-3 mr-1" />}
                                {mediaType === 'movie' ? 'Movie' : 'TV Show'}
                            </Badge>
                            <h2 className="text-2xl font-bold text-white">{title}</h2>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-300">
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
                    <div className="p-6 text-white">
                        {isLoading && <div className="p-6 text-center text-gray-300">Loading details...</div>}
                        {error && <div className="p-6 text-center text-red-400 bg-red-900/20 rounded">Error: {error}</div>}

                        {!isLoading && !error && (
                            <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="w-full bg-gray-800 text-gray-300">
                                    <TabsTrigger onClick={() => setActiveTab('overview')} value="overview" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Overview</TabsTrigger>
                                    <TabsTrigger onClick={() => setActiveTab('cast')} value="cast" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Cast</TabsTrigger>
                                    <TabsTrigger onClick={() => setActiveTab('watch')} value="watch" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Watch</TabsTrigger>
                                    <TabsTrigger onClick={() => setActiveTab('videos')} value="videos" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Videos</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="mt-6">
                                    {/* Synopsis */}
                                    {synopsis && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold mb-2 text-white">Synopsis</h3>
                                            <p className="text-gray-300">{synopsis}</p>
                                        </div>
                                    )}

                                    {/* Genres */}
                                    {genres.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold mb-2 text-white">Genres</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {genres.map(genre => (
                                                    <Badge key={genre.id} variant="outline" className="border-gray-700 text-gray-300">
                                                        {genre.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* trailer button */}
                                    <Button variant="outline" className="w-full bg-purple-900 hover:bg-purple-800 text-white" onClick={() => {
                                        // switch to the trailer tab
                                        setActiveTab('videos');
                                    }}>
                                        <Play className="h-4 w-4 mr-2" />
                                        Watch Trailer
                                    </Button>
                                </TabsContent>

                                <TabsContent value="cast" className="mt-6">
                                    {cast.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {cast.map(person => (
                                                <div key={person.id} className="text-center">
                                                    <img
                                                        src={getImageUrl(person.profile_path, 'w185') || "/placeholder.svg"}
                                                        alt={person.name}
                                                        className="w-full h-auto rounded-lg mb-2"
                                                    />
                                                    <p className="font-medium text-sm text-white">{person.name}</p>
                                                    <p className="text-xs text-gray-400">{person.character}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="watch" className="mt-6">
                                    {(flatProviders?.length > 0 || rentProviders?.length > 0 || buyProviders?.length > 0) ? (
                                        <div className="space-y-4">
                                            {flatProviders?.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2 text-gray-300">Stream</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {flatProviders.map(provider => (
                                                            <img
                                                                key={provider.provider_id}
                                                                src={getImageUrl(provider.logo_path, 'w92')}
                                                                alt={provider.provider_name}
                                                                title={provider.provider_name}
                                                                className="w-8 h-8 rounded-lg"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {rentProviders?.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2 text-gray-300">Rent</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {rentProviders.map(provider => (
                                                            <img
                                                                key={provider.provider_id}
                                                                src={getImageUrl(provider.logo_path, 'w92')}
                                                                alt={provider.provider_name}
                                                                title={provider.provider_name}
                                                                className="w-8 h-8 rounded-lg"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {buyProviders?.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2 text-gray-300">Buy</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {buyProviders.map(provider => (
                                                            <img
                                                                key={provider.provider_id}
                                                                src={getImageUrl(provider.logo_path, 'w92')}
                                                                alt={provider.provider_name}
                                                                title={provider.provider_name}
                                                                className="w-8 h-8 rounded-lg"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            No streaming options available in {regionName}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="videos" className="mt-6">
                                    {trailers.length > 0 ? (
                                        <div className="space-y-4">
                                            {trailers.slice(0, 2).map(trailer => (
                                                <div key={trailer.key} className="aspect-video">
                                                    <iframe
                                                        src={getYoutubeEmbedUrl(trailer.key)}
                                                        title={trailer.name}
                                                        className="w-full h-full rounded-lg"
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            No videos available
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                    <DialogFooter className="p-4 bg-gray-900 border-t border-gray-800">
                        <Button
                            variant={isAddedToWatchlist ? "default" : "outline"}
                            onClick={() => onAddToWatchlist(item)}
                            className={isAddedToWatchlist ? "bg-purple-900 hover:bg-purple-800 text-white" : "bg-gray-600 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"}
                        >
                            {isAddedToWatchlist ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    In Watchlist
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add to Watchlist
                                </>
                            )}
                        </Button>
                        <DialogClose asChild>
                            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
                                Close
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </ScrollArea>


            </DialogContent>
        </Dialog>
    );
} 
