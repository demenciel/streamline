import React from 'react'
import {
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ArrowPathRoundedSquareIcon,
} from "@heroicons/react/24/outline"
import { WandSparklesIcon } from 'lucide-react'
import { Input } from "@/Components/ui/input"

const HeadSection = ({
    setIsRegionModalOpen,
    userRegion,
    setMode,
    setSearchActive,
    isLoading,
    searchActive,
    searchQuery,
    handleInputChange,
    skipToRandom,
    startQuiz,
    mode
}) => {
    return (
        <>
            <section className="w-full flex flex-col items-center text-center gap-3 mb-6">
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                    PickForMeDaddy<span className="text-purple-500">.</span>
                </h1>
                <p className="text-gray-300 text-sm sm:text-base max-w-xl">
                    <span className="font-semibold text-white text-lg">Stop scrolling. Start watching.</span>
                    <br />
                    AI-powered <span className="text-purple-400 font-medium">mood</span> &amp;
                    <span className="text-purple-400 font-medium"> chaos</span> picks across platforms.
                </p>
                <span className="text-gray-500 text-xs sm:text-sm">
                    You’re browsing from <span onClick={() => {
                        setIsRegionModalOpen(true)
                    }} className="text-gray-300 cursor-pointer">{userRegion}</span>
                </span>
            </section>

            {/* Make buttons stack better on mobile */}
            <section className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 sm:mt-8 w-full">
                {/* segmented control */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setMode('personal')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${mode === 'personal'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <WandSparklesIcon className="inline-block h-5 w-5 mr-1" />
                        Mood-Based
                    </button>
                    <button
                        onClick={() => setMode('random')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${mode === 'random'
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <ArrowPathRoundedSquareIcon className="inline-block h-5 w-5 mr-1" />
                        Random
                    </button>
                </div>

                {/* search button */}
                <button
                    disabled={isLoading}
                    onClick={() => setSearchActive(x => !x)}
                    className="flex items-center px-4 py-2 border border-purple-900 rounded-lg text-sm text-white bg-transparent hover:bg-purple-800 transition"
                >
                    <MagnifyingGlassIcon className="h-5 w-5 mr-1" />
                    Search
                </button>
            </section>

            {/* ---- Primary CTA ---- */}
            <div className="mt-6 flex flex-col items-center gap-2">
                <span className="text-xs text-gray-400">One tap to end the indecision</span>
                <button
                    disabled={isLoading}
                    onClick={mode === 'random' ? skipToRandom : startQuiz}
                    className="flex items-center px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-full text-white font-semibold transition"
                >
                    {isLoading ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin mx-auto text-white" />
                    ) : (mode === 'random' ? 'Surprise Me Daddy' : 'Pick Something for Me')}
                </button>
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
        </>
    )
}

export default HeadSection