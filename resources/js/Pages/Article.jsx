import React from 'react';
import { Head } from '@inertiajs/react'
export default function Article({ article }) {
    return (
        <>
            <Head>
                <title>{article.title}</title>
                <meta name="description" content={article.content} />
            </Head>
            <div className="min-h-screen bg-gray-900 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Hero Section */}
                    <div className="mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">{article.title}</h1>
                        <div className="flex items-center space-x-4 text-gray-400 mb-8 text-sm sm:text-base">
                            <span>Published on {article.date || 'December 15, 2023'}</span>
                            <span>•</span>
                            <span>5 min read</span>
                        </div>
                    </div>

                    {/* Article Content */}
                    <div className="prose prose-lg prose-invert max-w-none">
                        <div className="bg-gray-800 rounded-xl p-8 sm:p-10 border border-gray-700">
                            <div className="text-gray-300 leading-relaxed">
                                {/* Article introduction - first paragraph with larger text */}
                                <div className="text-xl text-gray-200 mb-8 leading-relaxed font-light">
                                    {article.content.split('\n\n')[0]}
                                </div>

                                {/* Rest of the paragraphs */}
                                <div className="space-y-6">
                                    {article.content.split('\n\n').slice(1).map((paragraph, index) => (
                                        <p key={index} className="text-base sm:text-lg leading-relaxed">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            {/* Article footer with tags and share options */}
                            <div className="mt-12 pt-8 border-t border-gray-700">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">Movies</span>
                                        <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">Streaming</span>
                                        <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">Entertainment</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition text-sm">
                                            Share Article
                                        </button>
                                        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition text-sm">
                                            Save for Later
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation and Related Articles */}
                    <div className="mt-12">
                        <div className="flex justify-between items-center mb-8">
                            <a
                                href="/"
                                className="text-purple-400 hover:text-purple-300 transition flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                Back to Articles
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 