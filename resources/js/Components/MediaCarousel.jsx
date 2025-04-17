"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, PlayIcon, ChevronDownIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { DetailsDialog } from "./DetailsDialog";

// Utility function
const getImageUrl = (path, size = "w342") => {
    if (!path) return "https://via.placeholder.com/342x513?text=No+Image";
    return `/tmdb-image/${size}${path}`;
};

const getVideoUrl = (id, item) => {
    const mediaType = item?.media_type || (item?.title ? 'movie' : 'tv');
    const videosUrl = `api/tmdb/${mediaType}/${id}/videos`;
    return `/tmdb-video/${videosUrl}`;
};

export function MediaCarousel({
    title,
    items = [],
    onAddToWatchlist,
    onShowDetails,
    watchlist = [],
    onRequestMoreItems,
    featuredItemId,
}) {
    const containerRef = useRef(null);
    const isScrollingRef = useRef(false);
    const lastSelectedIdRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const [hoveredItemIndex, setHoveredItemIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [item, setItem] = useState(null);
    const [isAddedToWatchlist, setIsAddedToWatchlist] = useState(false);

    // Calculate items per view based on container width
    const calculateItemsPerView = useCallback(() => {
        if (!containerRef.current) return 6;

        const width = containerRef.current.offsetWidth;
        const itemWidth = 180; // Netflix uses smaller thumbnails
        return Math.floor(width / itemWidth);
    }, []);

    const [itemsPerView, setItemsPerView] = useState(6);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHoveringContainer, setIsHoveringContainer] = useState(false);

    // Recalculate items per view on mount and resize
    useEffect(() => {
        const handleResize = () => {
            setItemsPerView(calculateItemsPerView());
        };

        // Initial calculation
        handleResize();

        // Set up event listener
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [calculateItemsPerView]);

    // Handle carousel navigation
    const smoothScroll = useCallback((newIndex) => {
        // Clear any existing timeout
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        // Set scrolling flag
        isScrollingRef.current = true;

        // Update index
        setCurrentIndex(newIndex);

        // Reset scrolling flag after animation completes
        scrollTimeoutRef.current = setTimeout(() => {
            isScrollingRef.current = false;
        }, 600);
    }, []);

    // Navigation functions
    const nextSlide = useCallback(() => {
        if (isScrollingRef.current || !items.length) return;

        const maxStartIndex = Math.max(0, items.length - itemsPerView);
        const newIndex = Math.min(currentIndex + Math.floor(itemsPerView / 2), maxStartIndex);

        // Request more items if approaching the end
        if (newIndex + itemsPerView >= items.length && onRequestMoreItems) {
            onRequestMoreItems();
        }

        smoothScroll(newIndex);
    }, [items.length, itemsPerView, currentIndex, onRequestMoreItems, smoothScroll]);

    const prevSlide = useCallback(() => {
        if (isScrollingRef.current || !items.length) return;

        const newIndex = Math.max(0, currentIndex - Math.floor(itemsPerView / 2));
        smoothScroll(newIndex);
    }, [currentIndex, smoothScroll, items.length, itemsPerView]);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    // Render nothing if there are no items
    if (!items?.length) {
        return null;
    }

    return (
        <div className="my-8 relative group h-full"
            onMouseEnter={() => setIsHoveringContainer(true)}
            onMouseLeave={() => {
                setIsHoveringContainer(false);
                setHoveredItemIndex(null);
            }}
        >
            {/* Row title with see all link */}
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium text-white group-hover:text-white transition-colors duration-200">
                    {title}
                </h2>
                <Button
                    variant="ghost"
                    className="text-gray-400 hover:text-white text-sm"
                    size="sm"
                >
                    See all
                </Button>
            </div>

            <div className="relative" ref={containerRef}>
                {/* Navigation arrows - Netflix style (only show on row hover) */}
                {currentIndex > 0 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "absolute -left-12 top-1/2 transform -translate-y-1/2 z-50 h-full w-12",
                            "bg-black/50 text-white opacity-0 transition-opacity duration-200 z-50",
                            isHoveringContainer && "opacity-100"
                        )}
                        onClick={prevSlide}
                        disabled={isScrollingRef.current}
                    >
                        <ChevronLeftIcon className="h-8 w-8" />
                    </Button>
                )}

                {currentIndex < items.length - itemsPerView && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "absolute -right-12 top-1/2 transform -translate-y-1/2 z-50 h-full w-12",
                            "bg-black/50 text-white opacity-0 transition-opacity duration-200 z-50",
                            isHoveringContainer && "opacity-100"
                        )}
                        onClick={nextSlide}
                        disabled={isScrollingRef.current}
                    >
                        <ChevronRightIcon className="h-8 w-8" />
                    </Button>
                )}

                {/* Items container */}
                <div className="">
                    <div
                        className="flex transition-transform duration-500 ease-out h-full"
                        style={{
                            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`
                        }}
                    >
                        {items.map((item, index) => {
                            const itemTitle = item.title || item.name || "";
                            const year = item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4);
                            const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
                            const mediaType = item.media_type || (item.title ? "movie" : "tv");
                            const isInWatchlist = watchlist.some((w) => w.id === item.id && w.media_type === mediaType);
                            const isHovered = hoveredItemIndex === index;

                            return (
                                <div
                                    key={`${mediaType}-${item.id}`}
                                    className={cn(
                                        "flex-shrink-0 transition-all duration-200 px-[2px] relative",
                                        isHovered ? "z-50" : "z-0"  // Higher z-index when hovered
                                    )}
                                    style={{
                                        width: `${100 / itemsPerView}%`,
                                        height: "120px",
                                    }}
                                    onMouseEnter={() => setHoveredItemIndex(index)}
                                >
                                    <div
                                        className={cn(
                                            "group/item relative rounded-sm overflow-hidden transition-all duration-300",
                                            isHovered ? "scale-[2] h-[200px] shadow-2xl -translate-y-[20%]" : "scale-100",
                                            index === 0 && isHovered ? "origin-left" : "",
                                            index === items.length - 1 && isHovered ? "origin-right" : "",
                                        )}
                                    >
                                        {/* Poster image */}
                                        <div className="relative w-full h-full">
                                            {!isHovered && (
                                                <img
                                                    src={getImageUrl(item.backdrop_path || item.poster_path, "w780")}
                                                    alt={itemTitle}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            )}

                                            {/* Netflix-style hover card */}
                                            {isHovered && (
                                                <div className="absolute inset-0 flex flex-col bg-gray-900">
                                                    {/* Main image with title overlay */}
                                                    <div className="relative w-full flex-grow">
                                                        <img
                                                            src={getImageUrl(item.backdrop_path || item.poster_path, "w780")}
                                                            alt={itemTitle}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute w-full bg-gradient-to-b from-transparent to-black/100 h-1/2 bottom-0" />
                                                        {/* Title overlay */}
                                                        <div className="absolute flex items-center justify-start bottom-0 left-4 right-0">
                                                            <h2 className="text-md font-bold text-white tracking-tight">{itemTitle}</h2>
                                                        </div>
                                                    </div>

                                                    {/* Controls section */}
                                                    <div className="pt-4 px-4 bg-gray-900">
                                                        {/* Action buttons */}
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    size="icon"
                                                                    className="rounded-full bg-white hover:bg-white/90 text-black h-6 w-6"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        onShowDetails(item)
                                                                    }}
                                                                >
                                                                    <InformationCircleIcon className="h-3 w-3" />
                                                                </Button>

                                                                <Button
                                                                    variant={isInWatchlist ? "default" : "outline"}
                                                                    size="icon"
                                                                    onClick={(e) => {
                                                                        // add to watchlist
                                                                        onAddToWatchlist(item)
                                                                    }}
                                                                    className={cn(
                                                                        "rounded-full h-4 w-4 border-white/40",
                                                                        isInWatchlist ? "bg-white text-black" : "bg-black/40 text-white hover:bg-black/60",
                                                                    )}
                                                                >
                                                                    {isInWatchlist ? <CheckIcon className="h-2 w-2" /> : <PlusIcon className="h-2 w-2" />}
                                                                </Button>
                                                            </div>

                                                            <div className="flex items-center text-sm">
                                                                <div className="border border-white/50 px-1 py-0.5 text-xs text-white">{year}</div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            )}
                                            {/*  <DetailsDialog
                                                isOpen={isOpen}
                                                onClose={() => setIsOpen(false)}
                                                item={item}
                                                onAddToWatchlist={onAddToWatchlist}
                                                isAddedToWatchlist={isInWatchlist}
                                            /> */}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
