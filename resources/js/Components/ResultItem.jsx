import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Star } from 'lucide-react';
import { cn } from "@/lib/utils";

// Utility function (can be moved to a shared utils file)
const getImageUrl = (path, size = "w342") => {
    if (!path) return 'https://via.placeholder.com/342x513?text=No+Image';
    return `/tmdb-image/${size}/${path}`;
};

export function ResultItem({ item, onAddToWatchlist, onShowDetails, isAddedToWatchlist }) {
    const title = item.title || item.name;
    const year = item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4);
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

    // Get rating color based on score
    const getRatingColor = (ratingValue) => {
        if (ratingValue === 'N/A') return 'bg-gray-500';
        const r = parseFloat(ratingValue);
        if (r >= 8) return 'bg-emerald-500';
        if (r >= 6) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    return (
        <Card className="group overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-gradient-to-b from-white to-gray-50 rounded-xl">
            <CardHeader className="p-0 relative overflow-hidden">
                <div 
                    onClick={() => onShowDetails(item)} 
                    className="block w-full aspect-[2/3] cursor-pointer overflow-hidden"
                >
                    <img
                        src={getImageUrl(item.poster_path, 'w342') || "/placeholder.svg"}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="absolute bottom-0 left-0 w-full p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full bg-white/90 backdrop-blur-sm text-gray-800 hover:bg-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowDetails(item);
                            }}
                        >
                            View Details
                        </Button>
                    </div>
                </div>
                
                {rating !== 'N/A' && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 backdrop-blur-sm bg-black/30 rounded-full px-2 py-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-white text-xs font-medium">{rating}</span>
                    </div>
                )}
            </CardHeader>
            
            <CardContent className="p-3 flex-grow flex flex-col">
                <h3 
                    className="font-semibold leading-tight mb-1 cursor-pointer hover:text-purple-600 transition-colors duration-200" 
                    onClick={() => onShowDetails(item)}
                    title={title}
                >
                    {title.length > 40 ? `${title.substring(0, 37)}...` : title}
                </h3>
                {year && <p className="text-xs text-gray-500">{year}</p>}
            </CardContent>
            
            <CardFooter className="p-3 pt-0 mt-auto">
                <Button
                    variant={isAddedToWatchlist ? "default" : "outline"}
                    size="sm"
                    className={cn(
                        "w-full text-xs flex items-center justify-center gap-1.5 transition-all duration-300",
                        isAddedToWatchlist 
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                            : "hover:border-purple-500 hover:text-purple-600"
                    )}
                    onClick={() => !isAddedToWatchlist && onAddToWatchlist(item)}
                    disabled={isAddedToWatchlist}
                    title={isAddedToWatchlist ? 'Already in your watchlist' : 'Add to your watchlist'}
                >
                    {isAddedToWatchlist ? (
                        <>
                            <Check className="h-3.5 w-3.5" />
                            <span>In Watchlist</span>
                        </>
                    ) : (
                        <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add to Watchlist</span>
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
