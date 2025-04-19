import React from 'react'
import { Head } from '@inertiajs/react'

const Privacy = () => {
    return (
        <>
            <Head
                title="PickForMeDaddy | Terms of Use"
                description="By using PickForMeDaddy, you're agreeing to our chaotic but beautiful vision of streaming suggestions."
            />
            <section className="min-h-screen w-full bg-gray-900 text-white container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-x-hidden">
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 overflow-x-hidden max-w-3xl">
                    <h1 className="text-3xl font-bold text-white mb-6">Terms of Use</h1>
                    <p className="mb-4">By using PickForMeDaddy, you're agreeing to our chaotic but beautiful vision of streaming suggestions.</p>
                    <ul className="list-disc list-inside mb-4">
                        <li>We don’t guarantee perfect picks. Taste is subjective, you know?</li>
                        <li>Use the site responsibly. Don’t scrape, spam, or hack.</li>
                        <li>We might update features, change stuff, or vibe differently — and that’s part of the ride.</li>
                    </ul>
                    <p className="mb-4">If anything in these terms confuses you, reach out to us. We’re real humans behind this.</p>
                </div>
                <footer className="text-gray-500 text-sm py-6 mt-16 border-t border-gray-800">
                    <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-3">
                        <p>&copy; {new Date().getFullYear()} PickForMeDaddy. Made with chaos 💜</p>
                        <div className="flex gap-4">
                            <a href="/" className="hover:text-white">PickForMeDaddy</a>
                            <a href="/privacy" className="hover:text-white">Privacy Policy</a>
                            <a href="/terms" className="hover:text-white">Terms of Use</a>
                            <a href="/contact" className="hover:text-white">Contact</a>
                        </div>
                    </div>
                </footer>
            </section>
        </>
    )
}

export default Privacy