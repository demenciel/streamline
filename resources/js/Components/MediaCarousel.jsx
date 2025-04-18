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
    const scrollTimeoutRef = useRef(null);
    const [hoveredItemIndex, setHoveredItemIndex] = useState(null);
    const [selectedItemIndex, setSelectedItemIndex] = useState(null); // For mobile touch
    const [isGridView, setIsGridView] = useState(true);
    const [imagesLoaded, setImagesLoaded] = useState({}); // Track loaded image status by ID
    const [isReady, setIsReady] = useState(false); // Ready state for the entire carousel
    const [isMobile, setIsMobile] = useState(false); // Track if using mobile device


    // Calculate how many images we need before displaying
    const minImagesToShow = Math.min(6, items.length);


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

    useEffect(() => {
        setImagesLoaded({});
        setIsReady(false);

        // If there are no items, consider ready
        if (!items.length) {
            setIsReady(true);
            return;
        }

        // Preload the first 6 images (or all if fewer than 6)
        const imagesToPreload = items.slice(0, minImagesToShow);
        const imagePromises = imagesToPreload.map(item => {
            return new Promise((resolve) => {
                const img = new Image();
                const mediaType = item.media_type || (item.title ? "movie" : "tv");
                const id = `${mediaType}-${item.id}`;

                img.onload = () => {
                    setImagesLoaded(prev => ({ ...prev, [id]: true }));
                    resolve();
                };

                img.onerror = () => {
                    // Even on error, consider it "loaded" to avoid blocking the UI
                    setImagesLoaded(prev => ({ ...prev, [id]: true }));
                    resolve();
                };

                img.src = getImageUrl(item.backdrop_path || item.poster_path, "w780");
            });
        });

        // Set ready state when all required images are loaded
        Promise.all(imagePromises).then(() => {
            setIsReady(true);
        });
    }, [items]);

    // Detect if on mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        };

        // Check on initial load
        checkMobile();

        // Recheck when window is resized
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle item selection (for mobile)
    const handleItemClick = (index) => {
        if (isMobile) {
            // If already selected, deselect it
            if (selectedItemIndex === index) {
                setSelectedItemIndex(null);
            } else {
                setSelectedItemIndex(index);
            }
        }
    };

    // Get if an item is "active" (hovered on desktop or selected on mobile)
    const isItemActive = (index) => {
        if (isMobile) {
            return selectedItemIndex === index;
        } else {
            return hoveredItemIndex === index;
        }
    };

    // Early return while loading
    if (!items?.length) {
        return null;
    }

    const getScaleAmount = () => {
        if (isMobile) {
            return window.innerWidth < 400 ? 1.25 : 1.4;
        }
        return 1.75; // Reduced from 2x for better fit
    };

    return (
        <div className="my-8 relative group">
            {/* Row title with see all link */}
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium text-white group-hover:text-white transition-colors duration-200">
                    {title}
                </h2>
                {/* {isReady && (
                    <Button
                        variant="ghost"
                        className="text-gray-400 hover:text-white text-sm"
                        size="sm"
                        onClick={() => setIsGridView(!isGridView)}
                    >
                        {isGridView ? "Show Less" : "See All"}
                    </Button>
                )} */}
            </div>

            {!isReady && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array(minImagesToShow).fill(0).map((_, index) => (
                        <div key={`skeleton-${index}`} className="animate-pulse">
                            <div className="bg-gray-800 w-full h-[120px] rounded-sm"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Grid View */}
            {isReady && (isGridView ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {items.map((item, index) => {
                        const itemTitle = item.title || item.name || "";
                        const year = item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4);
                        const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
                        const mediaType = item.media_type || (item.title ? "movie" : "tv");
                        const isInWatchlist = watchlist.some((w) => w.id === item.id && w.media_type === mediaType);
                        const isActive = isItemActive(index);

                        return (
                            <div
                                key={`${mediaType}-${item.id}`}
                                className={cn(
                                    "flex-shrink-0 transition-all duration-200 px-[2px] relative",
                                    isActive ? "z-50" : "z-0",
                                    "mb-12 sm:mb-0"
                                )}
                                style={{
                                    width: "100%",
                                    height: isMobile ? (window.innerWidth < 640 ? "160px" : "120px") : "120px",
                                    margin: isMobile ? "2rem 0" : "0 0",
                                }}
                                onClick={() => handleItemClick(index)}
                                onMouseEnter={() => !isMobile && setHoveredItemIndex(index)}
                                onMouseLeave={() => !isMobile && setHoveredItemIndex(null)}
                            >
                                <div
                                    className={cn(
                                        "group/item relative rounded-sm overflow-hidden transition-all duration-300",
                                        isActive ? (window.innerWidth < 640 ? "scale-[1.2] h-[180px]" : "scale-[1.5] h-[200px]") : "scale-100",
                                        window.innerWidth < 640 ? "origin-center !-translate-y-0" : (
                                            index === 0 && isActive ? "origin-left -translate-y-[20%]" :
                                                index === items.length - 1 && isActive ? "origin-right -translate-y-[20%]" : "-translate-y-[20%]"
                                        ),
                                    )}
                                >
                                    {/* Poster image */}
                                    <div className="relative w-full h-full">
                                        {!isActive && (
                                            <>
                                                <p className="absolute top-0 left-0 text-white text-xs bg-black/50 px-2 py-1">
                                                    {itemTitle}
                                                </p>
                                                
                                                <img
                                                    src={getImageUrl(item.backdrop_path || item.poster_path, "w780")}
                                                    alt={itemTitle}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </>
                                        )}

                                        {/* Active card (hover or touch) */}
                                        {isActive && (
                                            <div className="absolute inset-0 flex flex-col bg-gray-900"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onShowDetails(item);
                                                }}
                                            >
                                                {/* Main image with title overlay */}
                                                <div className="relative w-full flex-grow">
                                                    <img
                                                        src={getImageUrl(item.backdrop_path || item.poster_path, "w780")}
                                                        alt={itemTitle}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute w-full bg-gradient-to-b from-transparent to-black/100 h-1/2 bottom-0" />
                                                    <div className="absolute flex items-center justify-start bottom-0 left-4 right-0">
                                                        <h2 className="text-md font-bold text-white tracking-tight">{itemTitle}</h2>
                                                    </div>
                                                </div>

                                                {/* Controls section */}
                                                <div className="pt-4 px-4 bg-gray-800">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="icon"
                                                                className={cn(
                                                                    "rounded-full bg-white hover:bg-white/90 text-black",
                                                                    isMobile ? "h-8 w-8" : "h-6 w-6" // Larger touch target on mobile
                                                                )}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onShowDetails(item);
                                                                }}
                                                            >
                                                                <InformationCircleIcon className={cn(isMobile ? "h-4 w-4" : "h-3 w-3")} />
                                                            </Button>

                                                            <Button
                                                                variant={isInWatchlist ? "default" : "outline"}
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onAddToWatchlist(item);
                                                                }}
                                                                className={cn(
                                                                    "rounded-full border-white/40",
                                                                    isInWatchlist ? "bg-white text-black" : "bg-black/40 text-white hover:bg-black/60",
                                                                    isMobile ? "h-8 w-8" : "h-4 w-4" // Larger on mobile
                                                                )}
                                                            >
                                                                {isInWatchlist ?
                                                                    <CheckIcon className={cn(isMobile ? "h-4 w-4" : "h-2 w-2")} /> :
                                                                    <PlusIcon className={cn(isMobile ? "h-4 w-4" : "h-2 w-2")} />
                                                                }
                                                            </Button>
                                                        </div>

                                                        <div className="flex items-center text-sm">
                                                            <div className="border border-white/50 px-1 py-0.5 text-xs text-white">{year}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile touch indicator */}
                                {isMobile && (
                                    <div className={cn(
                                        "absolute bottom-1 left-1/2 transform -translate-x-1/2 transition-opacity",
                                        isActive ? "opacity-0" : "opacity-70"
                                    )}>
                                        <div className="bg-black/70 rounded-full h-4 w-4 flex items-center justify-center text-white">
                                            <span className="text-[8px]">i</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="relative h-full w-full">
                    {/* Navigation arrows - Netflix style (only show on row hover) */}
                    {currentIndex > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute -left-12 top-1/2 transform -translate-y-1/2 z-10 h-full w-12",
                                "bg-black/50 text-white opacity-70 transition-opacity duration-200 z-10",
                                isHoveringContainer && "opacity-100"
                            )}
                            onClick={prevSlide}
                            disabled={isScrollingRef.current}
                        >
                            <ChevronLeftIcon className={cn("h-8 w-8", isHoveringContainer ? "text-white" : "text-gray-400")} />
                        </Button>
                    )}

                    {currentIndex < items.length - itemsPerView && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute -right-12 top-1/2 transform -translate-y-1/2 z-10 h-full w-12",
                                "bg-black/50 text-white opacity-70 transition-opacity duration-200 z-10",
                                isHoveringContainer && "opacity-100"
                            )}
                            onClick={nextSlide}
                            disabled={isScrollingRef.current}
                        >
                            <ChevronRightIcon className={cn("h-8 w-8", isHoveringContainer ? "text-white" : "text-gray-400")} />
                        </Button>
                    )}
                    <div
                        className={cn(
                            "relative h-full w-full",
                            // cache l'overflow par défaut, l'affiche au hover
                            isHoveringContainer ? "overflow-visible" : "overflow-hidden"
                        )}
                        ref={containerRef}
                        onMouseEnter={() => setIsHoveringContainer(true)}
                        onMouseLeave={() => setIsHoveringContainer(false)}
                    >


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
                                    const isActive = isItemActive(index);


                                    return (
                                        <div
                                            key={`${mediaType}-${item.id}`}
                                            className={cn(
                                                "flex-shrink-0 transition-all duration-200 px-[2px] relative",
                                                isActive ? "z-50" : "z-0",
                                                "mb-12 sm:mb-0"
                                            )}
                                            style={{
                                                width: `${100 / itemsPerView}%`,
                                                height: isMobile ? (window.innerWidth < 640 ? "160px" : "120px") : "120px",
                                            }}
                                            onClick={() => handleItemClick(index)}
                                            onMouseEnter={() => !isMobile && setHoveredItemIndex(index)}
                                            onMouseLeave={() => !isMobile && setHoveredItemIndex(null)}
                                        >
                                            <div
                                                className={cn(
                                                    "group/item relative rounded-sm overflow-hidden transition-all duration-300",
                                                    isActive ? (window.innerWidth < 640 ? "scale-[1.2] h-[180px]" : "scale-[1.5] h-[200px]") : "scale-100",
                                                    window.innerWidth < 640 ? "origin-center !-translate-y-0" : (
                                                        index === 0 && isActive ? "origin-left -translate-y-[20%]" :
                                                            index === items.length - 1 && isActive ? "origin-right -translate-y-[20%]" : "-translate-y-[20%]"
                                                    ),
                                                )}
                                            >
                                                {/* Poster image */}
                                                <div className="relative w-full h-full">
                                                    {!isActive && (
                                                        <img
                                                            src={getImageUrl(item.backdrop_path || item.poster_path, "w780")}
                                                            alt={itemTitle}
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    )}

                                                    {/* Active card (hover or touch) */}
                                                    {isActive && (
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
                                                                            className={cn(
                                                                                "rounded-full bg-white hover:bg-white/90 text-black",
                                                                                isMobile ? "h-8 w-8" : "h-6 w-6" // Larger touch target on mobile
                                                                            )}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                onShowDetails(item)
                                                                            }}
                                                                        >
                                                                            <InformationCircleIcon className={cn(isMobile ? "h-4 w-4" : "h-3 w-3")} />
                                                                        </Button>

                                                                        <Button
                                                                            variant={isInWatchlist ? "default" : "outline"}
                                                                            size="icon"
                                                                            onClick={(e) => {
                                                                                // add to watchlist
                                                                                onAddToWatchlist(item)
                                                                            }}
                                                                            className={cn(
                                                                                "rounded-full border-white/40",
                                                                                isInWatchlist ? "bg-white text-black" : "bg-black/40 text-white hover:bg-black/60",
                                                                                isMobile ? "h-8 w-8" : "h-4 w-4" // Larger on mobile
                                                                            )}
                                                                        >
                                                                            {isInWatchlist ?
                                                                                <CheckIcon className={cn(isMobile ? "h-4 w-4" : "h-2 w-2")} /> :
                                                                                <PlusIcon className={cn(isMobile ? "h-4 w-4" : "h-2 w-2")} />
                                                                            }
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
            ))}
            <div className="flex items-center justify-center">
                <Button
                    onClick={() => onRequestMoreItems()}
                    variant="outline" className="bg-gray-600 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                    Get more recommendations
                </Button>
            </div>
        </div>
    );
}
