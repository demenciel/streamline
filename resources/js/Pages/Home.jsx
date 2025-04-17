"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Head } from '@inertiajs/react'
import axios from 'axios'
import { debounce } from 'lodash'

// Import shadcn components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Import custom components
import { ResultItem } from "@/Components/ResultItem"
import { DetailsDialog } from "@/Components/DetailsDialog"
import { MediaCarousel } from '@/Components/MediaCarousel'

// Import Heroicons
import {
    StarIcon,
    PlusIcon,
    CheckIcon,
    MagnifyingGlassIcon,
    FilmIcon,
    TvIcon,
    CalendarIcon,
    ClockIcon,
    XMarkIcon,
    SparklesIcon,
    AdjustmentsHorizontalIcon,
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

    // Watchlist State
    const [watchlist, setWatchlist] = useState(() => {
        const saved = localStorage.getItem('watchlist')
        return saved ? JSON.parse(saved) : []
    })

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
        const fetchGenres = async () => {
            setIsLoading(true)
            try {
                const [movieRes, tvRes] = await Promise.all([
                    axios.get('/api/tmdb/genres/movie'),
                    axios.get('/api/tmdb/genres/tv')
                ])
                setMovieGenres(movieRes.data.genres || [])
                setTvGenres(tvRes.data.genres || [])
                setError(null)
            } catch (err) {
                console.error("Failed to fetch genres:", err)
                setError('Could not load genres. Please try refreshing.')
            } finally {
                setIsLoading(false)
            }
        }
        fetchGenres()
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
            console.log('Adding to watchlist:', watchlistItem)
            setWatchlist(prev => [...prev, watchlistItem])
        } else {
            // remove from watchlist
            setWatchlist(watchlist.filter(w => !(w.id === watchlistItem.id && w.media_type === watchlistItem.media_type)))
            console.log('Item already in watchlist:', watchlistItem)
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
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            findQuizRecommendation()
        }
    }

    const findQuizRecommendation = async () => {
        setQuizLoading(true)
        setQuizError(null)
        setQuizRecommendation(null)
        setQuizRecommendations([])

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
                    setQuizActive(false)
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
        setCurrentQuizPage(prev => prev + 1)

        const cacheKey = JSON.stringify(quizAnswers)

        // If we have cached results, we can immediately get another recommendation
        if (quizResultsCache[cacheKey] && quizResultsCache[cacheKey].length > 0) {
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
                // need to hide the quiz recommendation card and the quiz
                setQuizActive(false)
            }
        }

        // If no more cached results, fetch a new page
        findQuizRecommendation()
    }

    return (
        <>
            <Head title="Minimalist Movie Finder" />
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 font-sans">
                {/* Header */}
                <header className="bg-gradient-purple text-white py-8 px-4 mb-8 shadow-md">
                    <div className="container mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center justify-center gap-2">
                            <FilmIcon className="h-8 w-8" />
                            <span>Movie Finder</span>
                        </h1>
                        <p className="text-sm md:text-base opacity-90">
                            Discover your next favorite movie or TV show
                        </p>
                        <div className="text-xs mt-2 opacity-75">
                            <span title="Content recommendations are based on this region">Region: {regionName} ({userRegion})</span>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto px-4 pb-12">
                    {/* "I'm Feeling Lucky" Section */}
                    <section className="mb-8 relative">
                        <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
                            <CardContent className="p-0">
                                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <SparklesIcon className="h-6 w-6" />
                                        <h2 className="text-2xl font-bold">I'm Feeling Lucky</h2>
                                    </div>
                                    <p className="opacity-90">Not sure what to watch? Let us recommend something based on your mood!</p>
                                </div>

                                <div className="p-6">
                                    {!quizActive && !quizRecommendation && !quizLoading && !quizError && (
                                        <div className="text-center py-8">
                                            <QuestionMarkCircleIcon className="h-16 w-16 mx-auto mb-4 text-purple-200" />
                                            <p className="mb-6 text-gray-600">Answer 5 quick questions to get a personalized recommendation!</p>
                                            <Button
                                                onClick={startQuiz}
                                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                                size="lg"
                                            >
                                                Start Quiz
                                            </Button>
                                        </div>
                                    )}

                                    {quizActive && (
                                        <div className="max-w-xl mx-auto">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-medium">Question {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}</h3>
                                                <span className="text-sm text-gray-500">{Math.round((currentQuestionIndex / QUIZ_QUESTIONS.length) * 100)}% complete</span>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
                                                <div
                                                    className="h-2 bg-purple-600 rounded-full transition-all duration-300"
                                                    style={{ width: `${(currentQuestionIndex / QUIZ_QUESTIONS.length) * 100}%` }}
                                                ></div>
                                            </div>

                                            <p className="mb-4 font-semibold text-xl">{QUIZ_QUESTIONS[currentQuestionIndex].question}</p>

                                            {QUIZ_QUESTIONS[currentQuestionIndex].type === 'radio' && (
                                                <RadioGroup
                                                    value={quizAnswers[QUIZ_QUESTIONS[currentQuestionIndex].key] || ''}
                                                    onValueChange={(value) => handleQuizAnswer(QUIZ_QUESTIONS[currentQuestionIndex].key, value)}
                                                    className="space-y-3 mb-6"
                                                >
                                                    {QUIZ_QUESTIONS[currentQuestionIndex].options.map(opt => (
                                                        <div key={opt.value} className="flex items-center space-x-2 p-3 rounded-lg border hover:border-purple-300 hover:bg-purple-50 transition-colors">
                                                            <RadioGroupItem
                                                                value={opt.value}
                                                                id={`${QUIZ_QUESTIONS[currentQuestionIndex].key}-${opt.value}`}
                                                                className="text-purple-600"
                                                            />
                                                            <Label
                                                                htmlFor={`${QUIZ_QUESTIONS[currentQuestionIndex].key}-${opt.value}`}
                                                                className="flex-grow cursor-pointer"
                                                            >
                                                                {opt.label}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            )}

                                            {QUIZ_QUESTIONS[currentQuestionIndex].type === 'checkbox' && (
                                                <div className="space-y-2 mb-6 grid grid-cols-2 gap-3">
                                                    {QUIZ_QUESTIONS[currentQuestionIndex].options.map(opt => (
                                                        <div
                                                            key={opt.value}
                                                            className="flex items-center space-x-2 p-3 rounded-lg border hover:border-purple-300 hover:bg-purple-50 transition-colors"
                                                        >
                                                            <Checkbox
                                                                id={`${QUIZ_QUESTIONS[currentQuestionIndex].key}-${opt.value}`}
                                                                checked={(quizAnswers[QUIZ_QUESTIONS[currentQuestionIndex].key] || []).includes(opt.value)}
                                                                onCheckedChange={(checked) => {
                                                                    const currentSelection = quizAnswers[QUIZ_QUESTIONS[currentQuestionIndex].key] || []
                                                                    const newSelection = checked
                                                                        ? [...currentSelection, opt.value]
                                                                        : currentSelection.filter(v => v !== opt.value)
                                                                    handleQuizAnswer(QUIZ_QUESTIONS[currentQuestionIndex].key, newSelection)
                                                                }}
                                                                className="text-purple-600"
                                                            />
                                                            <Label
                                                                htmlFor={`${QUIZ_QUESTIONS[currentQuestionIndex].key}-${opt.value}`}
                                                                className="text-sm font-medium leading-none flex items-center cursor-pointer"
                                                            >
                                                                {opt.label}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <Button
                                                onClick={goToNextQuestion}
                                                disabled={!quizAnswers[QUIZ_QUESTIONS[currentQuestionIndex].key] && QUIZ_QUESTIONS[currentQuestionIndex].type === 'radio'}
                                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                            >
                                                {currentQuestionIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'Get Recommendation'}
                                            </Button>
                                        </div>
                                    )}

                                    {quizLoading && (
                                        <div className="text-center py-12">
                                            <ArrowPathIcon className="h-12 w-12 mx-auto mb-4 text-purple-400 animate-spin" />
                                            <p className="text-gray-500">Finding your perfect match...</p>
                                        </div>
                                    )}

                                    {quizError && (
                                        <div className="text-center py-8">
                                            <p className="text-red-600 bg-red-50 p-4 rounded-lg mb-4">{quizError}</p>
                                            <Button onClick={startQuiz} variant="outline">Try Again</Button>
                                        </div>
                                    )}

                                    {quizRecommendation && !quizLoading && (
                                        <div className="mt-6">
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

                                            <div className="text-center mt-10 space-x-4">
                                                <Button
                                                    onClick={fetchAnotherRecommendation}
                                                    variant="outline"
                                                    className="border-purple-300 hover:border-purple-500 hover:text-purple-600"
                                                >
                                                    Try Another
                                                </Button>
                                                <Button
                                                    onClick={startQuiz}
                                                    variant="secondary"
                                                >
                                                    Restart Quiz
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {(quizError || quizRecommendation) && !quizLoading && (
                                        <div className="text-center mt-4">
                                            <Button
                                                onClick={() => { setQuizError(null); setQuizRecommendation(null); setQuizActive(false); }}
                                                variant="link"
                                                className="text-purple-600"
                                            >
                                                Back to Search
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Search & Filter Section */}
                    <section className="mb-8">
                        <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
                            <CardContent className="p-0">
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MagnifyingGlassIcon className="h-6 w-6" />
                                        <h2 className="text-2xl font-bold">Find Something to Watch</h2>
                                    </div>
                                    <p className="opacity-90">Search for movies and TV shows or use filters to discover new content</p>
                                </div>

                                <div className="p-6">
                                    {/* Search Input */}
                                    <div className="mb-6">
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <Input
                                                id="search"
                                                type="text"
                                                placeholder="Search movies or TV shows... (e.g., Dune, The Bear)"
                                                value={searchQuery}
                                                onChange={handleInputChange}
                                                className="pl-10 py-6 text-lg rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-300"
                                            />
                                        </div>
                                    </div>

                                    {/* Filters */}
                                    <div className="mb-4">
                                        <Accordion type="single" collapsible defaultValue="filters">
                                            <AccordionItem value="filters" className="border-none">
                                                <AccordionTrigger className="py-2 px-0 hover:no-underline">
                                                    <div className="flex items-center gap-2 text-purple-700">
                                                        <AdjustmentsHorizontalIcon className="h-5 w-5" />
                                                        <span className="font-medium">Advanced Filters</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start mt-4">
                                                        {/* Genre Filter */}
                                                        <div>
                                                            <Label htmlFor="genre" className="text-sm font-medium mb-2 block">Genre</Label>
                                                            <Select value={selectedGenre} onValueChange={handleGenreChange}>
                                                                <SelectTrigger id="genre" className="w-full">
                                                                    <SelectValue placeholder="Any Genre" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="all">Any Genre</SelectItem>
                                                                    {allGenres.map(genre => (
                                                                        <SelectItem key={genre.id} value={String(genre.id)}>
                                                                            {genre.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Year Range Filter */}
                                                        <div>
                                                            <Label htmlFor="year" className="block text-sm font-medium mb-2">
                                                                Release Year: {yearRange[0]} - {yearRange[1]}
                                                            </Label>
                                                            <Slider
                                                                id="year"
                                                                min={1900}
                                                                max={currentYear}
                                                                step={1}
                                                                value={yearRange}
                                                                onValueChange={handleYearChange}
                                                                className="mt-1"
                                                            />
                                                        </div>

                                                        {/* Rating Filter */}
                                                        <div>
                                                            <Label htmlFor="rating" className="block text-sm font-medium mb-2">
                                                                Minimum Rating: {minRating}+
                                                            </Label>
                                                            <Slider
                                                                id="rating"
                                                                min={0}
                                                                max={10}
                                                                step={0.5}
                                                                value={[minRating]}
                                                                onValueChange={handleRatingChange}
                                                                className="mt-1"
                                                            />
                                                        </div>

                                                        {/* Streaming Services Filter */}
                                                        <div>
                                                            <Label className="block text-sm font-medium mb-2">Available On</Label>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="outline" className="w-full justify-start font-normal">
                                                                        {selectedProviders.length === 0
                                                                            ? "Any Service"
                                                                            : `${selectedProviders.length} selected`}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <div className="p-4 grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                                                        {STREAMING_PROVIDERS.map(provider => (
                                                                            <div key={provider.id} className="flex items-center space-x-2">
                                                                                <Checkbox
                                                                                    id={`provider-${provider.id}`}
                                                                                    checked={selectedProviders.includes(provider.id)}
                                                                                    onCheckedChange={(checked) => handleProviderChange(provider.id, checked)}
                                                                                    className="text-purple-600"
                                                                                />
                                                                                <Label htmlFor={`provider-${provider.id}`} className="text-sm font-medium leading-none cursor-pointer">
                                                                                    {provider.name}
                                                                                </Label>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Results Display Section */}
                    <section className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <FilmIcon className="h-6 w-6 text-purple-600" />
                                Results
                            </h2>
                            {results.length > 0 && !isLoading && (
                                <Badge variant="outline" className="text-sm">
                                    {results.length} items found
                                </Badge>
                            )}
                        </div>

                        {isLoading && (
                            <div className="text-center py-16 bg-white rounded-xl shadow-md">
                                <ArrowPathIcon className="h-12 w-12 mx-auto mb-4 text-purple-400 animate-spin" />
                                <p className="text-gray-500">Loading results...</p>
                            </div>
                        )}

                        {error && !isLoading && (
                            <div className="text-center py-8 bg-red-50 rounded-xl">
                                <p className="text-red-600">{error}</p>
                                <Button onClick={handleFilterChange} variant="outline" className="mt-4">
                                    Try Again
                                </Button>
                            </div>
                        )}

                        {!isLoading && !error && results.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-xl shadow-md">
                                <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 mb-2">No results found</p>
                                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                            </div>
                        )}

                        {!isLoading && results.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {results.map(item => {
                                    const mediaType = item.media_type || (item.title ? 'movie' : 'tv')
                                    const isInWatchlist = watchlist.some(w => w.id === item.id && w.media_type === mediaType)

                                    return (
                                        <ResultItem
                                            key={`${mediaType}-${item.id}`}
                                            item={item}
                                            onAddToWatchlist={addToWatchlist}
                                            onShowDetails={handleShowDetails}
                                            isAddedToWatchlist={isInWatchlist}
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </section>

                    {/* Watchlist Section */}
                    <section>
                        <Accordion type="single" collapsible className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
                            <AccordionItem value="watchlist" className="border-0">
                                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                    <div className="flex items-center gap-2 text-gray-800">
                                        <CheckIcon className="h-5 w-5 text-purple-600" />
                                        <h2 className="text-xl font-semibold">My Watchlist ({watchlist.length})</h2>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6 pt-0">
                                    {watchlist.length > 0 ? (
                                        <div className="space-y-3">
                                            {watchlist.map((item) => (
                                                <div
                                                    key={`${item.media_type}-${item.id}`}
                                                    className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                                                >
                                                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleShowDetails(item)} title="Show Details">
                                                        <img
                                                            src={getImageUrl(item.poster_path, 'w92') || "/placeholder.svg?height=92&width=92"}
                                                            alt=""
                                                            className="w-12 h-auto object-cover rounded-md flex-shrink-0"
                                                        />
                                                        <div>
                                                            <span className="font-medium text-sm hover:text-purple-600 transition-colors">{item.title}</span>
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                {item.release_date && (
                                                                    <span className="flex items-center">
                                                                        <CalendarIcon className="h-3 w-3 mr-1" />
                                                                        {item.release_date?.substring(0, 4)}
                                                                    </span>
                                                                )}
                                                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                                    {item.media_type === 'movie' ? 'Movie' : 'TV'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item); }}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8"
                                                        title="Remove from watchlist"
                                                    >
                                                        <XMarkIcon className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 italic">
                                            <p>Your watchlist is empty. Add items using the 'Add to Watchlist' button.</p>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>

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
        </>
    )
} 
