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

const StreamButtonIcon = ({ flatProviders, rentProviders, buyProviders }) => {
    /* if (flatProviders?.length > 0) {
        return (
            <img
                className="h-4 w-4 mr-2"
                src={getImageUrl(flatProviders[0].logo_path, 'w92')}
                alt={flatProviders[0].provider_name}
            />
        );
    } else if (rentProviders?.length > 0) {
        return (
            <img
                className="h-4 w-4 mr-2"
                src={getImageUrl(rentProviders[0].logo_path, 'w92')}
                alt={rentProviders[0].provider_name}
            />
        );
    } else if (buyProviders?.length > 0) {
        return (
            <img
                className="h-4 w-4 mr-2"
                src={getImageUrl(buyProviders[0].logo_path, 'w92')}
                alt={buyProviders[0].provider_name}
            />
        );
    } else { */
    return <Play className="h-4 w-4 mr-2" />;
};

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

    const providersLinks = {
        'Netflix': 'https://www.netflix.com/',
        'Amazon Prime Video': 'https://www.amazon.com/gp/video/storefront/',
        'Disney+': 'https://www.disneyplus.com/',
        'Disney Plus': 'https://www.disneyplus.com/',
        'Hulu': 'https://www.hulu.com/',
        'HBO Max': 'https://www.hbomax.com/',
        'Apple TV+': 'https://www.apple.com/apple-tv-plus/',
        'Paramount+': 'https://www.paramountplus.com/',
        'Shudder': 'https://www.shudder.com/',
        'Cineplex': 'https://www.cineplex.com/',
        'AMC+': 'https://www.amcplus.com/',
        'Peacock': 'https://www.peacocktv.com/',
        "Max": 'https://www.max.com/',
        'Youtube': 'https://www.youtube.com/',
        'Google Play Movies': `https://play.google.com/store/`,
        'Amazon Video': 'https://www.amazon.com/gp/video/storefront/',
        'Vudu': 'https://www.vudu.com/',
        'Redbox': 'https://www.redbox.com/',
        'FandangoNOW': 'https://www.fandangonow.com/',
        'YouTube Movies': 'https://www.youtube.com/movies',
        'iTunes': 'https://www.apple.com/itunes/charts/movies/',
        'Microsoft Store': 'https://www.microsoft.com/en-us/store/movies-tv',
    }

    const getProviderColors = (providers) => {
        if (providers?.length === 0) {
            return 'bg-transparent'
        }
        const providerName = providers[0]?.provider_name
        const colors = {
            'Netflix': 'bg-red-600',
            'Amazon Prime Video': 'bg-[#00A8E1]', // Amazon blue
            'Amazon Video': 'bg-[#00A8E1]',
            'Disney+': 'bg-[#113CCF]',
            'Disney Plus': 'bg-[#113CCF]',
            'Hulu': 'bg-green-500',
            'HBO Max': 'bg-purple-700',
            'Max': 'bg-purple-700',
            'Apple TV+': 'bg-gray-800', // grayscale
            'Paramount+': 'bg-blue-500',
            'Shudder': 'bg-red-700',
            'Cineplex': 'bg-yellow-400',
            'AMC+': 'bg-red-500',
            'Peacock': 'bg-black',
            'Youtube': 'bg-red-500',
            'YouTube Movies': 'bg-red-500',
            'Google Play Movies': 'bg-[#34A853]', // Google green
            'Vudu': 'bg-blue-500',
            'Redbox': 'bg-red-700',
            'FandangoNOW': 'bg-orange-500',
            'iTunes': 'bg-pink-500',
            'Microsoft Store': 'bg-blue-700',
            'Crunchyroll': 'bg-orange-500',
        }
        const providerColor = Object.keys(colors).find(key => providerName.includes(key) || key.includes(providerName)) || 'bg-gray-700'
        return colors[providerColor] || 'bg-gray-700'
    }
    const getProviderColorsHover = (providers) => {
        if (providers?.length === 0) {
            return 'bg-transparent'
        }
        const providerName = providers[0]?.provider_name
        const colors = {
            'Netflix': 'hover:bg-red-800',
            'Amazon Prime Video': 'hover:bg-[#00A8E1]', // Amazon blue
            'Amazon Video': 'hover:bg-[#00A8E1]',
            'Disney+': 'hover:bg-[#113CCF]',
            'Disney Plus': 'hover:bg-[#113CCF]',
            'Hulu': 'hover:bg-green-600',
            'HBO Max': 'hover:bg-purple-800',
            'Max': 'hover:bg-purple-800',
            'Apple TV+': 'hover:bg-neutral-800', // grayscale
            'Paramount+': 'hover:bg-blue-600',
            'Shudder': 'hover:bg-red-800',
            'Cineplex': 'hover:bg-yellow-400',
            'AMC+': 'hover:bg-red-600',
            'Peacock': 'hover:bg-black',
            'Youtube': 'hover:bg-red-600',
            'YouTube Movies': 'hover:bg-red-600',
            'Google Play Movies': 'hover:bg-[#34A853]', // Google green
            'Vudu': 'hover:bg-blue-600',
            'Redbox': 'hover:bg-red-800',
            'FandangoNOW': 'hover:bg-orange-600',
            'iTunes': 'hover:bg-pink-600',
            'Microsoft Store': 'hover:bg-blue-800',
            'Crunchyroll': 'hover:bg-orange-600',
        }
        const providerColor = Object.keys(colors).find(key => providerName.includes(key) || key.includes(providerName)) || 'bg-gray-700'
        return colors[providerColor] || 'bg-gray-700'
    }


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

    const watchButtonText = (flatProviders, rentProviders, buyProviders) => {
        if (flatProviders?.length > 0) {
            return `Watch on ${flatProviders[0].provider_name}`;
        } else if (rentProviders?.length > 0) {
            return `Rent on ${rentProviders[0].provider_name}`;
        } else if (buyProviders?.length > 0) {
            return `Buy on ${buyProviders[0].provider_name}`;
        } else {
            return 'Unavailable in your region';
        }
    }

    const getLinkToWatch = (flatProviders, rentProviders, buyProviders) => {
        let providerLink = '#';
        if (flatProviders?.length > 0) {
            providerLink = Object.keys(providersLinks).find(key => flatProviders[0].provider_name.includes(key) || key.includes(flatProviders[0].provider_name))
                ? providersLinks[Object.keys(providersLinks).find(key => flatProviders[0].provider_name.includes(key) || key.includes(flatProviders[0].provider_name))]
                : '#'
        } else if (rentProviders?.length > 0) {
            providerLink = Object.keys(providersLinks).find(key => rentProviders[0].provider_name.includes(key) || key.includes(rentProviders[0].provider_name))
                ? providersLinks[Object.keys(providersLinks).find(key => rentProviders[0].provider_name.includes(key) || key.includes(rentProviders[0].provider_name))]
                : '#'
        } else if (buyProviders?.length > 0) {
            providerLink = Object.keys(providersLinks).find(key => buyProviders[0].provider_name.includes(key) || key.includes(buyProviders[0].provider_name))
                ? providersLinks[Object.keys(providersLinks).find(key => buyProviders[0].provider_name.includes(key) || key.includes(buyProviders[0].provider_name))]
                : '#'
        }
        return providerLink;
    }

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

                                    <div className="flex flex-col md:flex-row gap-2">
                                        {/* trailer button */}
                                        <Button variant="outline"
                                            className={`w-full border bg-transparent border-purple-900 ${flatProviders?.length === 0 && rentProviders?.length === 0 && buyProviders?.length === 0 ? 'bg-purple-800' : 'bg-transparent'} hover:bg-purple-800 text-white`}
                                            onClick={() => {
                                                setActiveTab('videos');
                                            }}>
                                            <Play className="h-4 w-4 mr-2" />
                                            Watch Trailer
                                        </Button>
                                        {/*  */}
                                        <Button variant="outline"
                                            className={`w-full ${flatProviders?.length === 0 && rentProviders?.length === 0 && buyProviders?.length === 0 ? 'bg-transparent' : `${getProviderColors(flatProviders)}`} hover:${getProviderColors(flatProviders)} text-white border-0`}
                                            disabled={flatProviders?.length === 0 && rentProviders?.length === 0 && buyProviders?.length === 0}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (flatProviders?.length > 0 || rentProviders?.length > 0 || buyProviders?.length > 0) {
                                                    const link = getLinkToWatch(flatProviders, rentProviders, buyProviders)
                                                    console.log(link);
                                                    window.open(link, '_blank');
                                                }
                                            }}>
                                            <StreamButtonIcon flatProviders={flatProviders} rentProviders={rentProviders} buyProviders={buyProviders} />
                                            {watchButtonText(flatProviders, rentProviders, buyProviders)}
                                        </Button>
                                    </div>
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
                                                        {flatProviders.map(provider => {
                                                            return (
                                                                <a href={Object.keys(providersLinks).find(key => provider.provider_name.includes(key) || key.includes(provider.provider_name))
                                                                    ? providersLinks[Object.keys(providersLinks).find(key => provider.provider_name.includes(key) || key.includes(provider.provider_name))]
                                                                    : '#'} target="_blank" rel="noopener noreferrer">
                                                                    <img
                                                                        key={provider.provider_id}
                                                                        src={getImageUrl(provider.logo_path, 'w92')}
                                                                        alt={provider.provider_name}
                                                                        title={provider.provider_name}
                                                                        className="w-8 h-8 rounded-lg"
                                                                    />
                                                                </a>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {rentProviders?.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2 text-gray-300">Rent</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {rentProviders.map(provider => {
                                                            return (
                                                                <a href={Object.keys(providersLinks).find(key => provider.provider_name.includes(key) || key.includes(provider.provider_name))
                                                                    ? providersLinks[Object.keys(providersLinks).find(key => provider.provider_name.includes(key) || key.includes(provider.provider_name))]
                                                                    : '#'} target="_blank" rel="noopener noreferrer">
                                                                    <img
                                                                        key={provider.provider_id}
                                                                        src={getImageUrl(provider.logo_path, 'w92')}
                                                                        alt={provider.provider_name}
                                                                        title={provider.provider_name}
                                                                        className="w-8 h-8 rounded-lg"
                                                                    />
                                                                </a>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {buyProviders?.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2 text-gray-300">Buy</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {buyProviders.map(provider => {
                                                            return (
                                                                <a href={Object.keys(providersLinks).find(key => provider.provider_name.includes(key) || key.includes(provider.provider_name))
                                                                    ? providersLinks[Object.keys(providersLinks).find(key => provider.provider_name.includes(key) || key.includes(provider.provider_name))]
                                                                    : '#'} target="_blank" rel="noopener noreferrer">
                                                                    <img
                                                                        key={provider.provider_id}
                                                                        src={getImageUrl(provider.logo_path, 'w92')}
                                                                        alt={provider.provider_name}
                                                                        title={provider.provider_name}
                                                                        className="w-8 h-8 rounded-lg"
                                                                    />
                                                                </a>
                                                            )
                                                        })}
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
