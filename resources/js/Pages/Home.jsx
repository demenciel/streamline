import React, { useState, useEffect, useCallback } from 'react'
import { Head } from '@inertiajs/react'
import axios from 'axios'
import { debounce } from 'lodash'

// Import shadcn components
import { Button } from "@/Components/ui/button"
import { Label } from "@/Components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/Components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { Badge } from "@/Components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/Components/ui/dialog"
import { ScrollArea, ScrollBar } from "@/Components/ui/scroll-area"
import Modal from '@/Components/Modal';


// Import custom components
import { ResultItem } from "@/Components/ResultItem"
import { DetailsDialog } from "@/Components/DetailsDialog"
import EmailSignup from "@/Components/EmailSignup"

// Import Heroicons
import {
    CheckIcon,
    CalendarIcon,
    XMarkIcon,
    ArrowPathIcon,
    QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline"
import Dropdown from '@/Components/Dropdown'
import HeadSection from '@/Components/Head'

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
    const [mode, setMode] = useState('random')
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false)
    // Filter State
    const currentYear = new Date().getFullYear()
    const [selectedGenre, setSelectedGenre] = useState('')
    const [yearRange, setYearRange] = useState([1980, currentYear])
    const [minRating, setMinRating] = useState(6)
    const [selectedProviders, setSelectedProviders] = useState([])
    const [trendingMovies, setTrendingMovies] = useState([])
    const [trendingTvShows, setTrendingTvShows] = useState([])

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
    const [upcomingMovies, setUpcomingMovies] = useState([]);
    // Watchlist State
    const [watchlist, setWatchlist] = useState(() => {
        const saved = localStorage.getItem('watchlist')
        return saved ? JSON.parse(saved) : []
    })

    const commonRegions = [
        { label: 'United States', value: 'US' },
        { label: 'United Kingdom', value: 'GB' },
        { label: 'Canada', value: 'CA' },
        { label: 'Australia', value: 'AU' },
        { label: 'France', value: 'FR' },
        { label: 'Germany', value: 'DE' },
        { label: 'Italy', value: 'IT' },
        { label: 'Spain', value: 'ES' },
        { label: 'Brazil', value: 'BR' },
        { label: 'Mexico', value: 'MX' },
        { label: 'Argentina', value: 'AR' },
        { label: 'Chile', value: 'CL' },
        { label: 'Colombia', value: 'CO' },
        { label: 'Peru', value: 'PE' },
        { label: 'Venezuela', value: 'VE' },
        { label: 'Ecuador', value: 'EC' },
        { label: 'Panama', value: 'PA' },
        { label: 'Nicaragua', value: 'NI' },
        { label: 'Honduras', value: 'HN' },
        { label: 'El Salvador', value: 'SV' },
        { label: 'Guatemala', value: 'GT' },
        { label: 'Costa Rica', value: 'CR' },
    ]


    // browser language
    const [browserLanguage, setBrowserLanguage] = useState(navigator.language)
    // New state variables for better transitions
    const [direction, setDirection] = useState('right')
    const [isAnimating, setIsAnimating] = useState(false)

    const closeRegionModal = () => {
        setIsRegionModalOpen(false)
    }

    const openRegionModal = () => {
        setIsRegionModalOpen(true)
    }

    useEffect(() => {
        // Seed header from localStorage on mount
        try {
            const stored = window.localStorage.getItem('p4md_region')
            if (stored) {
                axios.defaults.headers.common['X-P4MD-Region'] = stored
            } else if (userRegion) {
                axios.defaults.headers.common['X-P4MD-Region'] = String(userRegion).toUpperCase()
            }
        } catch { }

        // React to region updates broadcasted by your modal
        const handler = () => {
            try {
                const stored = window.localStorage.getItem('p4md_region')
                if (stored) {
                    axios.defaults.headers.common['X-P4MD-Region'] = stored
                    window.location.reload()
                }
            } catch { }
        }
        window.addEventListener('region:updated', handler)
        return () => window.removeEventListener('region:updated', handler)
    }, [userRegion])

    // Save watchlist to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('watchlist', JSON.stringify(watchlist))
    }, [watchlist])

    // Detect user's region on mount
    useEffect(() => {
        // Try to get region from browser's language settings
        const savedRegion = localStorage.getItem('p4md_region')
        if (savedRegion) {
            setUserRegion(savedRegion)
        } else {
            const browserRegion = navigator.language?.split('-')[1]
            if (browserRegion && browserRegion.length === 2) {
                setUserRegion(browserRegion)
            }
            setTimeout(() => {
                openRegionModal()
            }, 1000)
        }
        // Also fetch from API to get the server-determined region
        const fetchRegionFromApi = async () => {
            try {
                if (savedRegion) {
                    return
                }
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

        const fetchUpcomingMovies = async () => {
            try {
                const response = await axios.get('/api/tmdb/upcoming', { params: { region: savedRegion, language: browserLanguage } })
                setUpcomingMovies(response.data.results || [])
            } catch (err) {
                console.error("Failed to fetch upcoming movies:", err)
            }
        }
        const fetchTrendingMovies = async () => {
            try {
                const response = await axios.get('/api/tmdb/trending/movie/', { params: { region: savedRegion, language: browserLanguage } })
                setTrendingMovies(response.data.results || [])
            } catch (err) {
                console.error("Failed to fetch trending movies:", err)
            }
        }

        const fetchTrendingTvShows = async () => {
            try {
                const response = await axios.get('/api/tmdb/trending/tv/', { params: { region: savedRegion, language: browserLanguage } })
                setTrendingTvShows(response.data.results || [])
            } catch (err) {
                console.error("Failed to fetch trending TV shows:", err)
            }
        }
        fetchRegionFromApi()
        fetchUpcomingMovies()
        fetchTrendingMovies()
        fetchTrendingTvShows()
    }, [])

    // Fetch Genres on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true) // Use main loading state
            try {
                // Fetch Genres

                const [movieRes, tvRes] = await Promise.all([
                    axios.get('/api/tmdb/genres/movie'),
                    axios.get('/api/tmdb/genres/tv'),
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
                title="PickForMeDaddy — Stop scrolling. Start watching."
                description="AI-powered mood & chaos picks for Netflix, Prime, Disney+ and more. No more doomscrolling — just press play."
                ogTitle="PickForMeDaddy — Chaos picks, cozy nights."
                ogDescription="Let your vibe choose tonight’s movie or show. Mood quiz or ‘Surprise Me Daddy’ in one tap."
                ogImage="/images/pickformedaddy-social-share.jpg"
            />

            {/* Main app */}
            <section className="min-h-screen w-full bg-gray-900 text-white">
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-x-hidden">
                    {/* Header Section - Improved with logo */}
                    <header className="w-full flex flex-col items-center justify-between gap-3 mb-6">
                        <HeadSection
                            setIsRegionModalOpen={setIsRegionModalOpen}
                            userRegion={userRegion}
                            setMode={setMode}
                            setSearchActive={setSearchActive}
                            isLoading={isLoading}
                            searchActive={searchActive}
                            searchQuery={searchQuery}
                            handleInputChange={handleInputChange}
                            skipToRandom={skipToRandom}
                            startQuiz={startQuiz}
                            mode={mode}
                        />
                    </header>

                    {/* "I'm Feeling Lucky" Result Card */}
                    {showQuizResultCard && quizRecommendation && !quizActive && (
                        <div className="mt-8">
                            <h3 className="text-xl font-semibold mb-6 text-center">We recommend:</h3>

                            {/* Replace separate featured item with central carousel */}
                            <div className="w-full">
                                {quizRecommendations.length > 0 && (
                                    <>
                                        {/* Mobile swipeable view */}
                                        <div className="block sm:hidden mb-4 overflow-x-auto pb-4">
                                            <div className="flex w-max gap-3 px-2">
                                                {quizRecommendations.map(item => (
                                                    <div key={`${item.id}-${item.media_type}`} className="w-[180px] flex-shrink-0 snap-start">
                                                        <ResultItem
                                                            item={item}
                                                            onAddToWatchlist={addToWatchlist}
                                                            onShowDetails={handleShowDetails}
                                                            isAddedToWatchlist={watchlist.some(
                                                                w => w.id === item.id && w.media_type === item.media_type
                                                            )}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Desktop grid view */}
                                        <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                                            {quizRecommendations.map(item => (
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
                                    </>
                                )}
                            </div>
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
                    ) : (results.length > 0 && !quizRecommendation) && searchActive ? (
                        <div className="w-full">
                            <h2 className="text-xl font-bold text-white mb-4">Search Results</h2>
                            {/* Swipeable results for mobile / grid for larger screens */}
                            {results.length > 0 && (
                                <>
                                    {/* Mobile swipeable view */}
                                    <div className="block sm:hidden mb-4 overflow-x-auto pb-4">
                                        <div className="flex w-max gap-3 px-2">
                                            {results.map(item => (
                                                <div key={`${item.id}-${item.media_type}`} className="w-[180px] flex-shrink-0 snap-start">
                                                    <ResultItem
                                                        item={item}
                                                        onAddToWatchlist={addToWatchlist}
                                                        onShowDetails={handleShowDetails}
                                                        isAddedToWatchlist={watchlist.some(
                                                            w => w.id === item.id && w.media_type === item.media_type
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Desktop grid view */}
                                    <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
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
                                </>
                            )}
                        </div>
                    ) : !quizRecommendation && !quizActive && searchQuery && (
                        <div className="text-center py-12">
                            <QuestionMarkCircleIcon className="h-12 w-12 mx-auto text-gray-600" />
                            <p className="mt-4 text-gray-400">
                                {searchQuery
                                    ? "No results found. Try adjusting your search or filters."
                                    : "Search for movies and TV shows, or try the 'Pick Something for Me' button!"}
                            </p>
                        </div>
                    )}
                    {/* Email capture — build your list */}
                    <section className="mt-8">
                        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 sm:p-6">
                            <EmailSignup
                                title="Get weekly mood-based picks in your inbox"
                                subtitle="Short &amp; sweet—top 5 watch ideas for your vibe and region."
                                ctaLabel="Send me the picks"
                                successMessage="You're on the list! Check your inbox for a welcome email."
                            />
                        </div>
                    </section>
                    {/* NEW: Featured Content Section - Added for AdSense compliance */}
                    <section className="my-16 bg-gray-800/40 p-4 sm:p-6 rounded-xl border border-gray-700">
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            <div className="w-full md:w-1/3">
                                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Popular Right Now</h2>
                                <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden relative mb-2">
                                    {trendingMovies && trendingMovies[0] && (
                                        <img
                                            src={getImageUrl(trendingMovies[0].backdrop_path, 'w500') || "/placeholder.svg?height=280&width=500"}
                                            alt={trendingMovies[0].title || trendingMovies[0].name}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 p-3">
                                        <h3 className="font-bold text-white text-lg">
                                            {trendingMovies && trendingMovies[0] ? (trendingMovies[0].title || trendingMovies[0].name) : "Loading trending content..."}
                                        </h3>
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm mb-3">
                                    {trendingMovies && trendingMovies[0] ? trendingMovies[0].overview?.substring(0, 120) + "..." : "Discover what everyone's watching this week."}
                                </p>
                                <button
                                    onClick={() => trendingMovies && trendingMovies[0] && handleShowDetails(trendingMovies[0])}
                                    className="text-sm text-purple-400 hover:text-purple-300"
                                >
                                    View Details →
                                </button>
                            </div>

                            <div className="w-full md:w-2/3">
                                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">How It Works</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
                                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-full">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-900 text-white mb-3">1</div>
                                        <h3 className="font-bold text-white mb-2">Choose Your Mode</h3>
                                        <p className="text-gray-300 text-sm">Select mood-based for personalized picks or random for a surprise.</p>
                                    </div>
                                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-full">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-900 text-white mb-3">2</div>
                                        <h3 className="font-bold text-white mb-2">Answer Questions</h3>
                                        <p className="text-gray-300 text-sm">Tell us your mood, preferences, and what you're in the mood for.</p>
                                    </div>
                                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-full">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-900 text-white mb-3">3</div>
                                        <h3 className="font-bold text-white mb-2">Get Recommendations</h3>
                                        <p className="text-gray-300 text-sm">We’ll show watch-ready matches (by region) and email you a weekly top-5.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    {/* Main content area - Improved layout for AdSense */}
                    {!results.length > 0 && !quizRecommendation && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            {/* Left column - About the service */}
                            <div className="md:col-span-2">
                                <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-4 sm:p-6">
                                    <h2 className="text-2xl font-bold text-white mb-4">What is PickForMeDaddy?</h2>
                                    <p className="mb-4 text-gray-300">
                                        PickForMeDaddy is your new fave streaming sidekick. Instead of scrolling forever through
                                        <strong className="text-white"> Netflix, Prime, Disney+</strong>, and more, we help you choose what to watch based on your <strong className="text-purple-400">mood</strong>.
                                    </p>
                                    <p className="mb-4 text-gray-300">
                                        Whether you're feeling spicy, sad, weird, or just chaotic — our mood quiz or "Surprise Me Daddy" button gets you a curated pick in seconds.
                                    </p>
                                    <p className="mb-4 text-gray-300">
                                        Plus, you can search across platforms, save your faves in a watchlist, and never argue with your roommate about what to watch again.
                                    </p>

                                    {/* NEW: Added FAQ section */}
                                    <h3 className="text-xl font-bold text-white mt-8 mb-4">Frequently Asked Questions</h3>
                                    <div className="space-y-4">
                                        <div className="border-b border-gray-700 pb-3">
                                            <h4 className="font-bold text-white mb-2">How does the recommendation system work?</h4>
                                            <p className="text-gray-300">
                                                Our picks are powered by vibes and chaos (with a little help from TheMovieDB API). You tell us your mood, we suggest a movie or show — no overthinking required.
                                            </p>
                                        </div>
                                        <div className="border-b border-gray-700 pb-3">
                                            <h4 className="font-bold text-white mb-2">Which streaming services are supported?</h4>
                                            <p className="text-gray-300">
                                                We don't partner directly with streaming platforms — but thanks to TheMovieDB, we can show you where your pick is available. So yes, you'll still know if it's on Netflix, Prime, Disney+, etc.
                                            </p>
                                        </div>
                                        <div className="border-b border-gray-700 pb-3">
                                            <h4 className="font-bold text-white mb-2">Is this service free to use?</h4>
                                            <p className="text-gray-300">
                                                Yup. 100% free. No paywall, no weird catch — just pure recommendation magic. We might run some light ads to keep the lights on, but that's it.
                                            </p>
                                        </div>
                                    </div>


                                    <p className="mt-6 text-gray-300">
                                        Built with love by indecisive streamers. We're still improving things — if something feels off,
                                        <a href="mailto:contact@techno-saas.com" className="underline text-purple-400"> let us know</a>.
                                    </p>
                                    <div className="mt-6">
                                        <EmailSignup
                                            compact
                                            title="Prefer email?"
                                            subtitle="Get one curated list every Friday."
                                            ctaLabel="Join the list"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right column - Popular genres & Ad space */}
                            <div className="space-y-6">
                                {/* Popular Genres */}
                                <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-4">
                                    <h3 className="text-xl font-bold text-white mb-3">Popular Genres</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Animation', 'Thriller'].map(genre => (
                                            <span key={genre} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm hover:bg-purple-900 hover:text-white transition-colors cursor-pointer">
                                                {genre}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Ad space placeholder */}
                                <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-4 text-center">
                                    <div className="text-gray-500 mb-2 text-xs">ADVERTISEMENT</div>
                                    <div className="h-64 bg-gray-800 rounded flex items-center justify-center">
                                        {/* AdSense will place ads here */}
                                        <div className="text-gray-600 text-sm">Ad Space</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Watchlist Section - Make it more mobile-friendly */}
                    <section className="my-8 sm:mt-12">
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

                    {/* Upcoming Movies Section */}
                    <section className="my-8 sm:mt-12">
                        <h2 className="text-2xl font-bold text-white mb-4">Upcoming Movies</h2>

                        <div className="w-full">
                            {upcomingMovies.length > 0 && (
                                <>
                                    {/* Mobile swipeable view */}
                                    <div className="block sm:hidden mb-4 overflow-x-auto pb-4">
                                        <div className="flex w-max gap-3 px-2">
                                            {upcomingMovies.map(item => (
                                                <div key={`${item.id}-${item.media_type}`} className="w-[180px] flex-shrink-0 snap-start">
                                                    <ResultItem
                                                        item={item}
                                                        onAddToWatchlist={addToWatchlist}
                                                        onShowDetails={handleShowDetails}
                                                        isAddedToWatchlist={watchlist.some(
                                                            w => w.id === item.id && w.media_type === item.media_type
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Desktop grid view */}
                                    <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                                        {upcomingMovies.map(item => (
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
                                </>
                            )}
                        </div>
                    </section>

                    {/* NEW: Popular TV Shows - Added content for AdSense */}
                    <section className="mt-8 sm:mt-12">
                        <h2 className="text-2xl font-bold text-white mb-4">Popular TV Shows</h2>
                        <div className="w-full">
                            {trendingTvShows.length > 0 && (
                                <>
                                    {/* Mobile swipeable view */}
                                    <div className="block sm:hidden mb-4 overflow-x-auto pb-4">
                                        <div className="flex w-max gap-3 px-2">
                                            {trendingTvShows.map(item => (
                                                <div key={`${item.id}-${item.media_type}`} className="w-[180px] flex-shrink-0 snap-start">
                                                    <ResultItem
                                                        item={item}
                                                        onAddToWatchlist={addToWatchlist}
                                                        onShowDetails={handleShowDetails}
                                                        isAddedToWatchlist={watchlist.some(
                                                            w => w.id === item.id && w.media_type === item.media_type
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Desktop grid view */}
                                    <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                                        {trendingTvShows.map(item => (
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
                                </>
                            )}
                        </div>
                    </section>

                    {/* NEW: Movie guides section - more content for AdSense */}
                    <section className="mt-8 sm:mt-12 bg-gray-800/30 rounded-xl border border-gray-700 p-4 sm:p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">Movie Guides & Articles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                                <div className="p-4">
                                    <h3 className="font-bold text-white mb-2">Ultimate Guide to Netflix Hidden Categories</h3>
                                    <p className="text-gray-300 text-sm mb-3">Discover secret Netflix codes to unlock thousands of hidden movies and shows.</p>
                                    <a href="/article/netflix-hidden-categories" className="text-purple-400 text-sm hover:text-purple-300">Read More →</a>
                                </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                                <div className="p-4">
                                    <h3 className="font-bold text-white mb-2">How to Host the Perfect Movie Night</h3>
                                    <p className="text-gray-300 text-sm mb-3">Tips for creating an amazing movie night experience with friends and family.</p>
                                    <a href="/article/perfect-movie-night" className="text-purple-400 text-sm hover:text-purple-300">Read More →</a>
                                </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                                <div className="p-4">
                                    <h3 className="font-bold text-white mb-2">Top 10 Underrated Sci-Fi Movies</h3>
                                    <p className="text-gray-300 text-sm mb-3">These hidden gems deserve more attention from science fiction fans.</p>
                                    <a href="/article/underrated-sci-fi-movies" className="text-purple-400 text-sm hover:text-purple-300">Read More →</a>
                                </div>
                            </div>
                        </div>
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
                                        <DialogFooter className="flex flex-row md:flex-col md:items-center md:gap-2 mt-4">
                                            <Button
                                                onClick={goToPreviousQuestion}
                                                disabled={currentQuestionIndex === 0}
                                                className="w-1/2 md:w-full bg-purple-900 hover:bg-purple-800 text-white disabled:bg-gray-700"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                onClick={goToNextQuestion}
                                                disabled={!quizAnswers[QUIZ_QUESTIONS[currentQuestionIndex].key]}
                                                className="w-1/2 md:w-full bg-purple-900 hover:bg-purple-800 text-white disabled:bg-gray-700"
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

                    {/* NEW: Enhanced footer with links and social media - More content */}
                    <footer className="mt-16 border-t border-gray-800 pt-8 pb-12">
                        <div className="container mx-auto px-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-4">PickForMeDaddy</h3>
                                    <p className="text-gray-400 text-sm mb-4">Your personal streaming guide that helps you find the perfect movie or TV show based on your mood.</p>
                                    <div className="flex space-x-4">
                                        <a href="#" className="text-gray-400 hover:text-purple-400">
                                            <span className="sr-only">Twitter</span>
                                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-white mb-4">Legal</h3>
                                    <ul className="space-y-2 text-gray-400">
                                        <li><a href="/privacy" className="hover:text-purple-400">Privacy Policy</a></li>
                                        <li><a href="/terms" className="hover:text-purple-400">Terms of Service</a></li>
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-gray-800 text-center">
                                <p className="text-gray-500">&copy; {new Date().getFullYear()} PickForMeDaddy. All rights reserved.</p>
                            </div>
                        </div>
                    </footer>
                </div>
            </section>
            <Modal
                show={isRegionModalOpen}
                onClose={closeRegionModal}
            >
                <div className="p-6 space-y-4 bg-gray-900">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            console.log('submit');
                            const fd = new FormData(e.currentTarget);
                            const region = (fd.get('region') || '').toString().trim().toUpperCase();
                            console.log(region)
                            if (region) {
                                setUserRegion(region)
                                window.localStorage.setItem('p4md_region', String(userRegion).toUpperCase());
                                window.dispatchEvent(new Event('region:updated'));
                                closeRegionModal()
                            } else {
                                window.localStorage.setItem('p4md_region', String(userRegion).toUpperCase());
                                window.dispatchEvent(new Event('region:updated'));
                                closeRegionModal()
                                console.log(userRegion)
                            }
                        }}
                        className="p-6 space-y-4"
                    >
                        <h2 className="text-lg font-semibold text-white">
                            Confirm your location
                        </h2>

                        <p className="text-sm text-gray-300">
                            We detected that you’re in <span className="font-medium text-white">{userRegion}</span>.
                            If that’s not correct, update it below. We use this to show what’s available on streaming services in your area.
                        </p>

                        <label className="block text-sm text-gray-300">
                            Region / Country code (e.g., <span className="font-mono">CA</span>, <span className="font-mono">US</span>)
                        </label>
                        <Dropdown
                            contentClasses="bg-gray-900 b-2 border border-gray-700"
                            width="full"
                        >
                            <Dropdown.Trigger>
                                <span className="inline-flex rounded-md">
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-md border border-1 px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                    >
                                        {userRegion}

                                        <svg
                                            className="-me-0.5 ms-2 h-4 w-4"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </span>
                            </Dropdown.Trigger>

                            <Dropdown.Content
                                contentClasses="bg-gray-900 b-2 border border-gray-700 absolute z-10"
                                align="left"
                            >
                                {commonRegions.map(region => (
                                    <Dropdown.Link
                                        key={region.value}
                                        className="text-gray-300"
                                        onClick={() => {
                                            setUserRegion(region.value)
                                        }}
                                    >
                                        {region.label}
                                    </Dropdown.Link>
                                ))}
                            </Dropdown.Content>
                        </Dropdown>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    try {
                                        window.localStorage.setItem('p4md_region', String(userRegion).toUpperCase());
                                        window.dispatchEvent(new Event('region:updated'));
                                        closeRegionModal();
                                    } catch { }
                                }}
                                className="px-4 py-2 text-sm rounded-md border border-gray-600 text-gray-200 hover:bg-gray-800"
                            >
                                Use detected
                            </button>
                            <button
                                type="submit"
                                id='region'
                                className="px-4 py-2 text-sm rounded-md bg-purple-600 hover:bg-purple-500 text-white"
                            >
                                Save location
                            </button>
                        </div>

                        <p className="text-xs text-gray-500">
                            Tip: If you’re using a VPN, detection can be off. Setting it manually here overrides detection.
                        </p>
                    </form>
                </div>
            </Modal>
        </>
    );
}
