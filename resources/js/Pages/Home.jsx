import React, { useState, useEffect, useCallback } from 'react'
import { Head } from '@inertiajs/react'
import axios from 'axios'
import { debounce } from 'lodash'

// Import shadcn components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// Import custom components
import { ResultItem } from "@/Components/ResultItem"
import { DetailsDialog } from "@/Components/DetailsDialog"
import { MediaCarousel } from '@/Components/MediaCarousel'

// Import Heroicons
import {
    CheckIcon,
    MagnifyingGlassIcon,
    CalendarIcon,
    XMarkIcon,
    SparklesIcon,
    ArrowPathIcon,
    QuestionMarkCircleIcon
} from "@heroicons/react/24/outline"

// Utility function for TMDB image URLs
const getImageUrl = (path, size = "w342") => {
    if (!path) return 'https://via.placeholder.com/342x513?text=No+Image'
    return `/tmdb-image/${size}/${path}`
}

// Hardcoded popular streaming services (TMDB IDs)
const STREAMING_PROVIDERS = [
    { id: 8, name: "Netflix", logo_path: "/t2yyOv4dA99KrYvelIAreasonq", country: "US" },
    { id: 9, name: "Amazon Prime Video", logo_path: "/emthp39XA2iNbK1XJyJczIYP2zt", country: "US" },
    { id: 337, name: "Disney+", logo_path: "/7rwgEs15tFwyR9NPQ5vpzxTj19Q", country: "US" },
    { id: 384, name: "HBO Max", logo_path: "/zrnzWEQSJXHDCwdStBfnCuKqUY1", country: "US" },
    { id: 1899, name: "Max", logo_path: "/oTQhC2e9LSaXstVAMTfAnYshqkD", country: "US" },
    { id: 2, name: "Apple TV", logo_path: "/peURlLlr8jggOwK53fJ5wdQl05y", country: "US" },
    { id: 350, name: "Apple TV+", logo_path: "/6uhKBfmtzFqOcLousHwZuzcrScK", country: "US" },
    { id: 15, name: "Hulu", logo_path: "/zQC6LbEDgWKq726ThN9TfxMTsdT", country: "US" },
    { id: 10, name: "Amazon Video", logo_path: "/sVBEF7q7LqjHAWSnKwDbzmr2EMY", country: "US" },
]

// Quiz Configuration
const QUIZ_QUESTIONS = [
    {
        question: "What are you in the mood for?",
        key: "mood",
        type: "radio",
        options: [
            { label: "Comedy", value: "35" },
            { label: "Drama", value: "18" },
            { label: "Action", value: "28" },
            { label: "Thriller/Horror", value: "53,27" },
            { label: "Sci-Fi/Fantasy", value: "878,14" },
            { label: "Family Animation", value: "10751,16" },
            { label: "Documentary", value: "99" },
            { label: "Romance", value: "10749" },
            { label: "Adventure", value: "12" },
            { label: "Crime", value: "80" },
            { label: "Mystery", value: "9648" },
            { label: "War", value: "10752" },
            { label: "Anime", value: "16" },

        ],
        param: "with_genres"
    },
    {
        question: "How much time do you have?",
        key: "runtime",
        type: "radio",
        options: [
            { label: "Quick episode (< 30 min)", value: "tv_short" },
            { label: "Standard episode (30-60 min)", value: "tv_standard" },
            { label: "Feature film (~1-2 hours)", value: "movie_standard" },
            { label: "Epic length (> 2 hours)", value: "movie_long" },
            { label: "Any", value: "any" }
        ],
        param: "with_runtime"
    },
    {
        question: "New releases or classics?",
        key: "era",
        type: "radio",
        options: [
            { label: "Latest (Last 2 Years)", value: "new" },
            { label: "Modern (Last 10 Years)", value: "modern" },
            { label: "Classics (Before 2000)", value: "classic" },
            { label: "Anything Goes", value: "any" }
        ],
        param: "primary_release_year"
    },
    {
        question: "Which streaming services do you use?",
        key: "providers",
        type: "checkbox",
        options: STREAMING_PROVIDERS.slice(0, 6).map(p => ({ label: p.name, value: String(p.id), logo: p.logo_path })),
        param: "with_watch_providers"
    },
    {
        question: "Who's watching?",
        key: "audience",
        type: "radio",
        options: [
            { label: "Just Me", value: "solo" },
            { label: "Date Night", value: "date" },
            { label: "Family Time", value: "family" },
            { label: "With Friends", value: "friends" }
        ],
        param: "audience_context"
    }
]

export default function Home(props) {
    const [searchQuery, setSearchQuery] = useState('')
    const [results, setResults] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [movieGenres, setMovieGenres] = useState([])
    const [tvGenres, setTvGenres] = useState([])
    const [userRegion, setUserRegion] = useState('US')
    const [regionName, setRegionName] = useState('United States')

    // Filter State
    const currentYear = new Date().getFullYear()
    const [selectedGenre, setSelectedGenre] = useState('')
    const [yearRange, setYearRange] = useState([1980, currentYear])
    const [minRating, setMinRating] = useState(6)
    const [selectedProviders, setSelectedProviders] = useState([])
    const [isGridView, setIsGridView] = useState(false);

    // Details Dialog State
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedItemDetails, setSelectedItemDetails] = useState(null)

    // Quiz State
    const [quizActive, setQuizActive] = useState(false)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [quizAnswers, setQuizAnswers] = useState({})
    const [quizRecommendation, setQuizRecommendation] = useState(null)
    const [quizLoading, setQuizLoading] = useState(false)
    const [quizError, setQuizError] = useState(null)
    const [previousRecommendations, setPreviousRecommendations] = useState([])
    const [quizResultsCache, setQuizResultsCache] = useState({})
    const [currentQuizPage, setCurrentQuizPage] = useState(1) // Track API page for quiz results
    const [quizRecommendations, setQuizRecommendations] = useState([])
    const [showQuizResultCard, setShowQuizResultCard] = useState(false);
    const [trendingItems, setTrendingItems] = useState([]); // State for trending items
    const [searchActive, setSearchActive] = useState(false);
    // Watchlist State
    const [watchlist, setWatchlist] = useState(() => {
        const saved = localStorage.getItem('watchlist')
        return saved ? JSON.parse(saved) : []
    })

    // New state variables for better transitions
    const [direction, setDirection] = useState('right')
    const [isAnimating, setIsAnimating] = useState(false)

    // Save watchlist to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('watchlist', JSON.stringify(watchlist))
    }, [watchlist])

    // Detect user's region on mount
    useEffect(() => {
        // Try to get region from browser's language settings
        const browserRegion = navigator.language?.split('-')[1]
        if (browserRegion && browserRegion.length === 2) {
            setUserRegion(browserRegion)
        }

        // Also fetch from API to get the server-determined region
        const fetchRegionFromApi = async () => {
            try {
                const response = await axios.get('/api/tmdb/localization')
                const region = response.data.region
                setUserRegion(region)

                // Map region code to human-readable name
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
                }
                setRegionName(regionNames[region] || region)
            } catch (err) {
                console.error("Failed to fetch region from API:", err)
                // Keep browser-detected region if API call fails
            }
        }

        fetchRegionFromApi()
    }, [])

    // Fetch Genres on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true) // Use main loading state
            try {
                // Fetch Genres
                const [movieRes, tvRes] = await Promise.all([
                    axios.get('/api/tmdb/genres/movie'),
                    axios.get('/api/tmdb/genres/tv')
                ]);
                setMovieGenres(movieRes.data.genres || []);
                setTvGenres(tvRes.data.genres || []);

                setError(null);
            } catch (err) {
                console.error("Failed to fetch initial data:", err)
                setError('Could not load initial page data. Please try refreshing.');
            } finally {
                setIsLoading(false);
            }
        }
        fetchInitialData();
    }, [])

    // Combined genres for filter dropdown
    const allGenres = [...movieGenres, ...tvGenres].reduce((acc, genre) => {
        if (!acc.some(g => g.id === genre.id)) {
            acc.push(genre)
        }
        return acc
    }, []).sort((a, b) => a.name.localeCompare(b.name))

    // API Call Logic
    const fetchData = useCallback(async (query, filters) => {
        setIsLoading(true)
        setError(null)

        try {
            let response
            const params = {
                ...(filters.with_genres && { with_genres: filters.with_genres }),
                ...(filters.minRating && { 'vote_average.gte': filters.minRating }),
                ...(filters.yearRange && {
                    'primary_release_date.gte': `${filters.yearRange[0]}-01-01`,
                    'primary_release_date.lte': `${filters.yearRange[1]}-12-31`,
                }),
                ...(filters.providers && filters.providers.length > 0 && {
                    with_watch_providers: filters.providers.join('|'),
                    watch_region: filters.region || userRegion
                }),
                ...(filters.region && { region: filters.region }),
            }

            if (query) {
                params.query = query
                delete params['primary_release_date.gte']
                delete params['primary_release_date.lte']
                delete params['vote_average.gte']
                response = await axios.get('/api/tmdb/search/multi', { params: { query: query } })
            } else {
                const discoverMediaType = 'movie'
                if (filters.yearRange) {
                    const dateKeyPrefix = discoverMediaType === 'tv' ? 'first_air_date' : 'primary_release_date'
                    params[`${dateKeyPrefix}.gte`] = `${filters.yearRange[0]}-01-01`
                    params[`${dateKeyPrefix}.lte`] = `${filters.yearRange[1]}-12-31`
                    if (discoverMediaType === 'tv') {
                        delete params['primary_release_date.gte']
                        delete params['primary_release_date.lte']
                    }
                }
                response = await axios.get(`/api/tmdb/discover/${discoverMediaType}`, { params })
            }

            let fetchedResults = response.data.results?.filter(item => item.media_type === 'movie' || item.media_type === 'tv') || []

            // Client-side filtering for search results
            if (query) {
                fetchedResults = fetchedResults.filter(item => {
                    const year = parseInt((item.release_date || item.first_air_date || '0').substring(0, 4))
                    const rating = item.vote_average || 0
                    const meetsYear = year >= filters.yearRange[0] && year <= filters.yearRange[1]
                    const meetsRating = rating >= filters.minRating
                    return meetsYear && meetsRating
                })
            }

            setResults(fetchedResults)
        } catch (err) {
            console.error("API Error:", err)
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch data.'
            setError(errorMsg)
            setResults([])
        } finally {
            setIsLoading(false)
        }
    }, [userRegion])

    // Debounced fetch function
    const debouncedFetchData = useCallback(debounce((query, filters) => {
        const currentFilters = {
            with_genres: selectedGenre,
            yearRange: yearRange,
            minRating: minRating,
            providers: selectedProviders,
            region: userRegion,
        }
        fetchData(query, currentFilters)
    }, 500), [fetchData, selectedGenre, yearRange, minRating, selectedProviders, userRegion])

    // Handlers
    const handleInputChange = (e) => {
        const query = e.target.value
        setSearchQuery(query)
        if (query) {
            setShowQuizResultCard(false);
        }
        handleFilterChange();
    }

    // Generic filter change handler
    const handleFilterChange = () => {
        const currentFilters = {
            with_genres: selectedGenre,
            yearRange: yearRange,
            minRating: minRating,
            providers: selectedProviders,
            region: userRegion,
        }
        debouncedFetchData(searchQuery, currentFilters)
    }

    // Specific handlers
    const handleGenreChange = (genreId) => {
        setSelectedGenre(genreId === 'all' ? '' : genreId)
        handleFilterChange()
    }

    const handleYearChange = (newRange) => {
        setYearRange(newRange)
        handleFilterChange()
    }

    const handleRatingChange = (newRating) => {
        setMinRating(newRating[0])
        handleFilterChange()
    }

    const handleProviderChange = (providerId, checked) => {
        setSelectedProviders(prev =>
            checked
                ? [...prev, providerId]
                : prev.filter(id => id !== providerId)
        )
        handleFilterChange()
    }

    const handleShowDetails = (item) => {
        setSelectedItemDetails(item)
        setIsDetailsOpen(true)
    }

    const handleCloseDetails = () => {
        setIsDetailsOpen(false)
        setSelectedItemDetails(null)
    }

    const addToWatchlist = (item) => {
        const mediaType = item.media_type || (item.title ? 'movie' : 'tv')

        const watchlistItem = {
            id: item.id,
            media_type: mediaType,
            title: item.title || item.name,
            release_date: item.release_date || item.first_air_date,
            poster_path: item.poster_path,
        }

        const alreadyExists = watchlist.some(w => w.id === watchlistItem.id && w.media_type === watchlistItem.media_type)

        if (!alreadyExists) {
            setWatchlist(prev => [...prev, watchlistItem])
        } else {
            // remove from watchlist
            setWatchlist(watchlist.filter(w => !(w.id === watchlistItem.id && w.media_type === watchlistItem.media_type)))
        }
    }

    const removeFromWatchlist = (item) => {
        const mediaType = item.media_type || (item.title ? 'movie' : 'tv')
        setWatchlist(watchlist.filter(w => !(w.id === item.id && w.media_type === mediaType)))
    }

    // Quiz Handlers
    const startQuiz = () => {
        setQuizAnswers({})
        setCurrentQuestionIndex(0)
        setQuizRecommendation(null)
        setPreviousRecommendations([])
        setQuizResultsCache({})
        setCurrentQuizPage(1)
        setQuizError(null)
        setQuizActive(true)
    }

    const handleQuizAnswer = (key, value) => {
        setQuizAnswers(prev => ({ ...prev, [key]: value }))
    }

    const goToNextQuestion = () => {
        if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
            setDirection('right')
            setIsAnimating(true)
            setTimeout(() => {
                setCurrentQuestionIndex(prev => prev + 1)
                setIsAnimating(false)
            }, 300)
        } else {
            findQuizRecommendation()
        }
    }

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setDirection('left')
            setIsAnimating(true)
            setTimeout(() => {
                setCurrentQuestionIndex(prev => prev - 1)
                setIsAnimating(false)
            }, 300)
        }
    }

    const findQuizRecommendation = async () => {
        setQuizLoading(true)
        setQuizError(null)
        setQuizRecommendation(null)
        setQuizRecommendations([])
        setShowQuizResultCard(false)

        const params = {}
        const answers = quizAnswers
        let mediaType = 'movie'

        // Generate consistent cache key from quiz answers
        const cacheKey = JSON.stringify(quizAnswers)

        // Check if we have cached results for these exact quiz answers
        if (quizResultsCache[cacheKey] && quizResultsCache[cacheKey].length > 0) {
            console.log('Using cached quiz results')

            // Filter out previously shown recommendations and items in watchlist
            const availableResults = quizResultsCache[cacheKey].filter(item => {
                const itemId = item.id
                const itemType = item.media_type || (item.title ? 'movie' : 'tv')

                // Check if it was previously recommended
                const wasPreviouslyRecommended = previousRecommendations.some(
                    prevItem => prevItem.id === itemId &&
                        (prevItem.media_type || (prevItem.title ? 'movie' : 'tv')) === itemType
                )

                // Check if it's in the watchlist
                const isInWatchlist = watchlist.some(
                    watchItem => watchItem.id === itemId && watchItem.media_type === itemType
                )

                // Only include items not previously recommended and not in watchlist
                return !wasPreviouslyRecommended && !isInWatchlist
            })

            if (availableResults.length > 0) {
                // Store the first result as the main recommendation
                const randomIndex = Math.floor(Math.random() * availableResults.length)
                const selectedItem = availableResults[randomIndex]

                // Store all available results for the carousel
                setQuizRecommendations(availableResults)
                setPreviousRecommendations(prev => [...prev, selectedItem])
                setQuizRecommendation(selectedItem)
                setShowQuizResultCard(true)
            } else {
                // If all cached results have been shown or are in watchlist, 
                // we'll fetch a new page of results
                console.log('Cached results exhausted, fetching more results')
                setCurrentQuizPage(prev => prev + 1)
            }
        }

        // Q1: Mood -> Genre
        if (answers.mood) params.with_genres = answers.mood

        // Q2: Runtime
        if (answers.runtime) {
            switch (answers.runtime) {
                case 'tv_short':
                    mediaType = 'tv'
                    params['with_runtime.lte'] = 30
                    break
                case 'tv_standard':
                    mediaType = 'tv'
                    params['with_runtime.gte'] = 30
                    params['with_runtime.lte'] = 60
                    break
                case 'movie_standard':
                    mediaType = 'movie'
                    params['with_runtime.gte'] = 60
                    params['with_runtime.lte'] = 120
                    break
                case 'movie_long':
                    mediaType = 'movie'
                    params['with_runtime.gte'] = 120
                    break
            }
        }

        // Q3: Era -> Year
        const currentYear = new Date().getFullYear()
        if (answers.era) {
            const yearParamPrefix = mediaType === 'tv' ? 'first_air_date' : 'primary_release_date'
            switch (answers.era) {
                case 'new':
                    params[`${yearParamPrefix}.gte`] = `${currentYear - 1}-01-01`
                    break
                case 'modern':
                    params[`${yearParamPrefix}.gte`] = `${currentYear - 9}-01-01`
                    params[`${yearParamPrefix}.lte`] = `${currentYear}-12-31`
                    break
                case 'classic':
                    params[`${yearParamPrefix}.lte`] = `1999-12-31`
                    break
            }
        }

        // Q4: Providers
        if (answers.providers && answers.providers.length > 0) {
            params.with_watch_providers = answers.providers.join('|')
            params.watch_region = userRegion
            params.region = userRegion
        }

        // Q5: Audience
        if (answers.audience === 'date' && !params.with_genres?.includes('10749')) {
            params.with_genres = params.with_genres ? `${params.with_genres},10749` : '10749'
        }

        params.sort_by = 'popularity.desc'
        params['vote_count.gte'] = 100

        // Add page parameter to get different results each time
        params.page = currentQuizPage

        try {
            const response = await axios.get(`/api/tmdb/discover/${mediaType}`, { params })
            const results = response.data.results || []

            if (results.length > 0) {
                // Add new results to cache
                setQuizResultsCache(prev => {
                    // If the cache exists, append new results, otherwise create a new entry
                    if (prev[cacheKey]) {
                        // Filter out duplicates before appending
                        const existingIds = new Set(prev[cacheKey].map(item => item.id))
                        const newResults = results.filter(item => !existingIds.has(item.id))
                        return {
                            ...prev,
                            [cacheKey]: [...prev[cacheKey], ...newResults]
                        }
                    } else {
                        return {
                            ...prev,
                            [cacheKey]: results
                        }
                    }
                })

                // Filter out items in watchlist and previous recommendations
                const filteredResults = results.filter(item => {
                    const itemId = item.id
                    const itemType = item.media_type || (item.title ? 'movie' : 'tv')

                    // Check if it's in the watchlist
                    const isInWatchlist = watchlist.some(
                        watchItem => watchItem.id === itemId && watchItem.media_type === itemType
                    )

                    // Check if it was previously recommended in this session
                    const wasPreviouslyRecommended = previousRecommendations.some(
                        prevItem => prevItem.id === itemId &&
                            (prevItem.media_type || (prevItem.title ? 'movie' : 'tv')) === itemType
                    )

                    return !isInWatchlist && !wasPreviouslyRecommended
                })

                if (filteredResults.length > 0) {
                    // Store the first result as the main recommendation
                    const randomIndex = Math.floor(Math.random() * filteredResults.length)
                    const selectedItem = filteredResults[randomIndex]

                    // Store all available results for the carousel
                    setQuizRecommendations(filteredResults)
                    setPreviousRecommendations(prev => [...prev, selectedItem])
                    setQuizRecommendation(selectedItem)
                    setShowQuizResultCard(true)
                } else if (results.length > 0) {
                    // If all results are in watchlist/previously shown, just pick a random one
                    // but prioritize ones not in watchlist
                    const notInWatchlist = results.filter(item => {
                        const itemId = item.id
                        const itemType = item.media_type || (item.title ? 'movie' : 'tv')
                        return !watchlist.some(w => w.id === itemId && w.media_type === itemType)
                    })

                    const resultsToUse = notInWatchlist.length > 0 ? notInWatchlist : results
                    const randomIndex = Math.floor(Math.random() * resultsToUse.length)

                    setPreviousRecommendations(prev => [...prev, resultsToUse[randomIndex]])
                    setQuizRecommendation(resultsToUse[randomIndex])
                    setShowQuizResultCard(true)
                } else {
                    setQuizError("Couldn't find a match with those preferences. Try again!")
                }
            } else {
                setQuizError("Couldn't find a match with those preferences. Try again!")
            }
        } catch (err) {
            console.error("Quiz API Error:", err)
            setQuizError(err.response?.data?.message || 'Failed to get recommendation.')
        } finally {
            setQuizLoading(false)
            setQuizActive(false)
        }
    }

    // Update fetchAnotherRecommendation to fetch new pages when needed
    const fetchAnotherRecommendation = () => {
        // Increment the page counter to ensure we get different results next time
        /* setCurrentQuizPage(prev => prev + 1)

        const cacheKey = JSON.stringify(quizAnswers) */
        findQuizRecommendation()

        // If we have cached results, we can immediately get another recommendation
        /* if (quizResultsCache[cacheKey] && quizResultsCache[cacheKey].length > 0) {
            setQuizLoading(true)

            // Filter out previously shown and watchlist items
            const availableResults = quizResultsCache[cacheKey].filter(item => {
                const itemId = item.id
                const itemType = item.media_type || (item.title ? 'movie' : 'tv')

                const wasPreviouslyRecommended = previousRecommendations.some(
                    prevItem => prevItem.id === itemId &&
                        (prevItem.media_type || (prevItem.title ? 'movie' : 'tv')) === itemType
                )

                const isInWatchlist = watchlist.some(
                    watchItem => watchItem.id === itemId && watchItem.media_type === itemType
                )

                return !wasPreviouslyRecommended && !isInWatchlist
            })

            if (availableResults.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableResults.length)
                const selectedItem = availableResults[randomIndex]

                // Update both the single recommendation and the carousel data
                setQuizRecommendations(availableResults)
                setPreviousRecommendations(prev => [...prev, selectedItem])
                setQuizRecommendation(selectedItem)
                setShowQuizResultCard(true)
            } else {
                // If no more *suitable* cached results, fetch a new page
                console.log('No suitable cached recommendations, fetching more...')
                findQuizRecommendation()
            }
        } else {
            console.log('No suitable cached recommendations, fetching more...')
            findQuizRecommendation()
        } */
        setQuizLoading(false)
        setQuizActive(false)
    }

    // Handler to close the quiz result card
    const closeQuizResultCard = () => {
        setShowQuizResultCard(false)
        setQuizRecommendation(null)
    }

    // Add this function near the other quiz handlers
    const skipToRandom = async () => {
        setQuizLoading(true)
        setQuizError(null)
        setIsLoading(true)
        setShowQuizResultCard(false)

        // 1. Pick movie or TV and a random page
        const mediaType = Math.random() > 0.5 ? 'movie' : 'tv'
        const randomPage = Math.floor(Math.random() * 5) + 1

        try {
            // 2. Discover popular titles in your region
            const params = {
                sort_by: 'popularity.desc',
                'vote_count.gte': 150,
                page: randomPage,
                region: userRegion,
                watch_region: userRegion,
                // optionally let TMDB filter some of this for you:
                // with_watch_monetization_types: 'flatrate',
            }
            const { data: { results = [] } } = await axios.get(
                `/api/tmdb/discover/${mediaType}`,
                { params }
            )
            if (!results.length) {
                throw new Error("No titles found on this page.")
            }

            // 3. Filter out only those actually available to stream/buy/rent/etc.
            const available = await filterByWatchProviders(results)
            if (!available.length) {
                throw new Error("Couldn't find any watchable titles in your region.")
            }

            // 4. Pick one at random and show it
            const selected = available[Math.floor(Math.random() * available.length)]
            setQuizRecommendations(available)
            setPreviousRecommendations(prev => [...prev, selected])
            setQuizRecommendation(selected)
            setShowQuizResultCard(true)

        } catch (err) {
            setQuizError(err.message)
        } finally {
            setQuizLoading(false)
            setIsLoading(false)
        }
    }


    const filterByWatchProviders = async (results) => {
        // fire off all provider lookups in parallel
        const checks = results.map(async (item) => {
            const mediaType = item.media_type || (item.title ? 'movie' : 'tv')
            try {
                const { data: { results: providers } } = await axios.get(
                    `/api/tmdb/${mediaType}/${item.id}/watch/providers`,
                    { params: { region: userRegion } }
                )
                // TMDB returns an object keyed by region codes
                const regionData = providers[userRegion] || {}
                // check any of these monetization arrays
                const hasProvider = ['flatrate', 'rent', 'buy', 'ads', 'free']
                    .some(key => Array.isArray(regionData[key]) && regionData[key].length > 0)

                if (hasProvider) return item
            } catch (err) {
                console.warn(`Providers lookup failed for ${mediaType}/${item.id}`, err)
            }
            return null
        })

        // wait for all lookups, then drop any nulls
        const settled = await Promise.all(checks)
        return settled.filter(Boolean)
    }


    return (
        <>
            <Head
                title="Vibeflix | Tired of Scrolling? Let Your Mood Pick the Movie"
                description="No more endless scrolling on Netflix. Vibeflix gives you a personalized pick based on your mood — instantly."
                ogTitle="Vibeflix | Your Mood. Your Movie."
                ogDescription="Feeling indecisive? Vibeflix recommends the perfect movie or show in seconds based on your vibe."
                ogImage="/images/vibeflix-social-share.jpg"
            />


            <div className="min-h-screen w-full bg-gray-900 text-white">
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-x-hidden">
                    {/* Header Section - Improve mobile spacing */}
                    <div className="w-full flex flex-col items-center justify-between gap-3 mb-6">
                        {/* Header Section */}
                        <div className="w-full flex flex-col items-center justify-between gap-3 mb-6 text-center">
                            <h1 className="text-3xl sm:text-4xl font-bold">
                                Vibeflix<span className="text-purple-500">.</span>
                            </h1>
                            <p className="text-gray-400 text-sm sm:text-base max-w-lg">
                                No more doom scrolling <span className="text-white font-semibold">Netflix</span> or <span className="text-white font-semibold">Prime</span>.
                                Let your <span className="text-purple-400 font-medium">mood</span> choose what to watch.
                            </p>
                            <span className="text-gray-500 text-xs sm:text-sm mt-1">Currently browsing from {userRegion}</span>
                        </div>

                        {/* Make buttons stack better on mobile */}
                        <div className='flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 sm:mt-8 w-full'>
                            <Button
                                onClick={startQuiz}
                                className="w-full h-10 sm:h-12 bg-purple-900 hover:bg-purple-800 text-white"
                            >
                                <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Personalized Recommendation
                            </Button>
                            <Button
                                onClick={skipToRandom}
                                className="w-full h-10 sm:h-12 bg-indigo-800 hover:bg-indigo-700 text-white"
                            >
                                <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Skip to Random
                            </Button>
                            <Button
                                onClick={() => setSearchActive(!searchActive)}
                                className="w-full h-10 sm:h-12 border border-purple-900 bg-transparent hover:bg-purple-800 text-white"
                            >
                                <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Search
                            </Button>
                        </div>

                        {/* Improve search input responsive layout */}
                        {searchActive && (
                            <div className="relative w-full mt-4">
                                <Input
                                    type="text"
                                    placeholder="Search movies and TV shows..."
                                    value={searchQuery}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-400"
                                />
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            </div>
                        )}
                    </div>

                    {/* "I'm Feeling Lucky" Result Card */}
                    {showQuizResultCard && quizRecommendation && !quizActive && (
                        <div className="mt-12">
                            <h3 className="text-xl font-semibold mb-6 text-center">We recommend:</h3>

                            {/* Replace separate featured item with central carousel */}
                            {quizRecommendations.length > 0 && (
                                <div className="my-4">
                                    <MediaCarousel
                                        title=""
                                        items={quizRecommendations}
                                        onAddToWatchlist={addToWatchlist}
                                        onShowDetails={handleShowDetails}
                                        watchlist={watchlist}
                                        onRequestMoreItems={fetchAnotherRecommendation}
                                        featuredItemId={quizRecommendation.id}
                                        onItemSelect={(item) => {
                                            // Update the featured recommendation when a different item is selected
                                            setQuizRecommendation(item);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results Section */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-purple-500" />
                            <p className="mt-2 text-gray-400">Loading...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-400 bg-red-900/20 rounded-lg">
                            <p>{error}</p>
                        </div>
                    ) : (results.length > 0 || !quizRecommendation) ? (
                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                            {results.map(item => (
                                <ResultItem
                                    key={`${item.id}-${item.media_type}`}
                                    item={item}
                                    onAddToWatchlist={addToWatchlist}
                                    onShowDetails={handleShowDetails}
                                    isAddedToWatchlist={watchlist.some(
                                        w => w.id === item.id && w.media_type === item.media_type
                                    )}
                                />
                            ))}
                        </div>
                    ) : !quizRecommendation && !quizActive && (
                        <div className="text-center py-12">
                            <QuestionMarkCircleIcon className="h-12 w-12 mx-auto text-gray-600" />
                            <p className="mt-4 text-gray-400">
                                {searchQuery
                                    ? "No results found. Try adjusting your search or filters."
                                    : "Search for movies and TV shows, or try the 'I'm Feeling Lucky' quiz!"}
                            </p>
                        </div>
                    )}

                    {/* Watchlist Section - Make it more mobile-friendly */}
                    <section className="mt-8 sm:mt-12">
                        <Accordion type="single" collapsible defaultValue="watchlist" className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 overflow-hidden">
                            <AccordionItem value="watchlist" className="border-b-0">
                                <AccordionTrigger className="px-3 sm:px-6 py-3 sm:py-4 hover:no-underline hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-2 text-white w-full">
                                        <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                                        <h2 className="text-base sm:text-xl font-semibold">My Watchlist</h2>
                                        <Badge variant="secondary" className="ml-auto bg-gray-700 text-gray-300">{watchlist.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 sm:px-6 pb-4 sm:pb-6 pt-0">
                                    {watchlist.length > 0 ? (
                                        <div className="space-y-3 mt-4">
                                            {watchlist.map((item) => {
                                                const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
                                                const itemYear = item.release_date?.substring(0, 4);
                                                return (
                                                    <div
                                                        key={`${mediaType}-${item.id}`}
                                                        className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-800 transition-colors border border-gray-700"
                                                    >
                                                        <div className="flex items-center space-x-4 cursor-pointer flex-1 min-w-0" onClick={() => handleShowDetails(item)} title="Show Details">
                                                            <img
                                                                src={getImageUrl(item.poster_path, 'w92') || "/placeholder.svg?height=92&width=92"}
                                                                alt={item.title}
                                                                className="w-12 h-[72px] object-cover rounded-md flex-shrink-0 bg-gray-700"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <span className="font-medium text-sm hover:text-purple-400 transition-colors block truncate">
                                                                    {item.title}
                                                                </span>
                                                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                                    {itemYear && (
                                                                        <span className="flex items-center">
                                                                            <CalendarIcon className="h-3 w-3 mr-1 opacity-70" />
                                                                            {itemYear}
                                                                        </span>
                                                                    )}
                                                                    <Badge variant="outline" className="text-xs px-1.5 py-0 border-gray-600 text-gray-400">
                                                                        {mediaType === 'movie' ? 'Movie' : 'TV'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item); }}
                                                            className="text-red-500 hover:text-red-400 hover:bg-red-900/30 rounded-full w-8 h-8 flex-shrink-0 ml-3"
                                                            title="Remove from watchlist"
                                                        >
                                                            <XMarkIcon className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 italic">
                                            <p>Your watchlist is empty. Add items using the '+' button on search results.</p>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </section>

                    {/* Quiz Dialog */}
                    {quizActive && (
                        <Dialog open={quizActive} onOpenChange={setQuizActive}>
                            <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800 text-white">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold text-white">
                                        {quizRecommendation ? "Here's what you might like!" : "Let's find something to watch"}
                                    </DialogTitle>
                                    {!quizRecommendation && (
                                        <DialogDescription className="text-gray-400">
                                            Question {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}
                                        </DialogDescription>
                                    )}
                                </DialogHeader>

                                {quizLoading ? (
                                    <div className="py-8 text-center">
                                        <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-purple-500" />
                                        <p className="mt-2 text-gray-400">Finding the perfect match...</p>
                                    </div>
                                ) : quizError ? (
                                    <div className="py-8 text-center">
                                        <p className="text-red-400">{quizError}</p>
                                        <Button
                                            onClick={startQuiz}
                                            className="mt-4 bg-purple-900 hover:bg-purple-800 text-white"
                                        >
                                            Try Again
                                        </Button>
                                    </div>
                                ) : quizRecommendation ? (
                                    <div>
                                        <div className="relative aspect-[2/3] mb-4">
                                            <img
                                                src={getImageUrl(quizRecommendation.poster_path, 'w500')}
                                                alt={quizRecommendation.title || quizRecommendation.name}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">
                                            {quizRecommendation.title || quizRecommendation.name}
                                        </h3>
                                        <p className="text-gray-400 mb-4">{quizRecommendation.overview}</p>
                                        <div className="flex justify-between gap-4">
                                            <Button
                                                onClick={() => handleShowDetails(quizRecommendation)}
                                                className="flex-1 bg-purple-900 hover:bg-purple-800 text-white"
                                            >
                                                View Details
                                            </Button>
                                            <Button
                                                onClick={fetchAnotherRecommendation}
                                                variant="outline"
                                                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                                            >
                                                Try Another
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="py-4">
                                            {!quizRecommendation && (
                                                <div className="w-full bg-gray-800 h-1 rounded mb-4">
                                                    <div
                                                        className="bg-purple-500 h-full transition-all ease-in-out duration-500"
                                                        style={{ width: `${((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                                                    />
                                                </div>
                                            )}
                                            <div className="relative overflow-hidden">
                                                <div className={`transition-all duration-300 ease-in-out ${isAnimating ?
                                                    (direction === 'right' ? 'translate-x-[-100%] opacity-0' : 'translate-x-[100%] opacity-0') :
                                                    'translate-x-0 opacity-100'}`}>
                                                    <h3 className="text-lg font-medium mb-4 text-white">
                                                        {QUIZ_QUESTIONS[currentQuestionIndex].question}
                                                    </h3>
                                                    {QUIZ_QUESTIONS[currentQuestionIndex].type === 'radio' ? (
                                                        <ScrollArea className="h-[350px] pr-2">
                                                            <RadioGroup
                                                                value={quizAnswers[QUIZ_QUESTIONS[currentQuestionIndex].key] || ''}
                                                                onValueChange={(value) => {
                                                                    handleQuizAnswer(QUIZ_QUESTIONS[currentQuestionIndex].key, value)
                                                                    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
                                                                        setTimeout(() => {
                                                                            goToNextQuestion()
                                                                        }, 700) // Slightly longer delay for better UX
                                                                    }
                                                                }}
                                                                className="space-y-2"
                                                            >
                                                                {QUIZ_QUESTIONS[currentQuestionIndex].options.map(option => (
                                                                    <div
                                                                        key={option.value}
                                                                        className={`
                                                                            flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-colors
                                                                            ${quizAnswers[QUIZ_QUESTIONS[currentQuestionIndex].key] === option.value
                                                                                ? 'bg-purple-900/20 border-purple-500'
                                                                                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                                                            }
                                                                        `}
                                                                    >
                                                                        <RadioGroupItem
                                                                            value={option.value}
                                                                            id={option.value}
                                                                            className="text-purple-500"
                                                                        />
                                                                        <Label
                                                                            htmlFor={option.value}
                                                                            className="flex-1 cursor-pointer text-gray-300"
                                                                        >
                                                                            {option.label}
                                                                        </Label>
                                                                    </div>
                                                                ))}
                                                            </RadioGroup>
                                                            <ScrollBar orientation="vertical" />
                                                        </ScrollArea>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {QUIZ_QUESTIONS[currentQuestionIndex].options.map(option => (
                                                                <div
                                                                    key={option.value}
                                                                    className={`
                                                                        relative rounded-lg border p-4 cursor-pointer transition-colors
                                                                        ${(quizAnswers[QUIZ_QUESTIONS[currentQuestionIndex].key] || []).includes(option.value)
                                                                            ? 'bg-purple-900/20 border-purple-500'
                                                                            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                                                        }
                                                                    `}
                                                                    onClick={() => {
                                                                        const currentValues = quizAnswers[QUIZ_QUESTIONS[currentQuestionIndex].key] || [];
                                                                        const newValues = currentValues.includes(option.value)
                                                                            ? currentValues.filter(v => v !== option.value)
                                                                            : [...currentValues, option.value];
                                                                        handleQuizAnswer(QUIZ_QUESTIONS[currentQuestionIndex].key, newValues);
                                                                    }}
                                                                >
                                                                    {/* {option.logo ? (
                                                                        <img
                                                                            src={getImageUrl(option.logo, 'w92')}
                                                                            alt={option.label}
                                                                            className="w-full h-auto rounded mb-2"
                                                                        />
                                                                    ) : null} */}
                                                                    <Label className="text-sm text-center block text-gray-300">
                                                                        {option.label}
                                                                    </Label>
                                                                    {(quizAnswers[QUIZ_QUESTIONS[currentQuestionIndex].key] || []).includes(option.value) && (
                                                                        <div className="absolute -top-2 -right-2 bg-purple-500 rounded-full p-0.5">
                                                                            <CheckIcon className="h-3 w-3 text-white" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                onClick={goToPreviousQuestion}
                                                disabled={currentQuestionIndex === 0}
                                                className="w-full bg-purple-900 hover:bg-purple-800 text-white disabled:bg-gray-700"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                onClick={goToNextQuestion}
                                                disabled={!quizAnswers[QUIZ_QUESTIONS[currentQuestionIndex].key]}
                                                className="w-full bg-purple-900 hover:bg-purple-800 text-white disabled:bg-gray-700"
                                            >
                                                {currentQuestionIndex === QUIZ_QUESTIONS.length - 1 ? "Find Matches" : "Next"}
                                            </Button>
                                        </DialogFooter>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    )}

                    {/* Details Dialog */}
                    <DetailsDialog
                        isOpen={isDetailsOpen}
                        onClose={handleCloseDetails}
                        item={selectedItemDetails}
                        onAddToWatchlist={addToWatchlist}
                        isAddedToWatchlist={
                            selectedItemDetails
                                ? watchlist.some(w => {
                                    const mediaType = selectedItemDetails.media_type ||
                                        (selectedItemDetails.title ? 'movie' : 'tv')
                                    return w.id === selectedItemDetails.id && w.media_type === mediaType
                                })
                                : false
                        }
                    />
                </div>
            </div>
        </>
    );
} 
