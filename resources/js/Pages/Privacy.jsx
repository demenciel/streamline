import React from 'react'
import { Head } from '@inertiajs/react'

const Privacy = () => {
    return (
        <>
            <Head
                title="PickForMeDaddy | Privacy Policy"
                description="Your privacy matters to us. At PickForMeDaddy, we collect minimal data and never sell or share your info with third parties. We're just here to recommend bangers, not be creepy."
            />
            <section className="min-h-screen w-full bg-gray-900 text-white container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-x-hidden">
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-3xl overflow-x-hidden">
                    <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
                    <p className="mb-4">Your privacy matters to us. At PickForMeDaddy, we collect minimal data and never sell or share your info with third parties. We're just here to recommend bangers, not be creepy.</p>
                    <p className="mb-4">We may collect:</p>
                    <ul className="list-disc list-inside mb-4">
                        <li>Anonymous usage data (for making the app better)</li>
                        <li>Movie/show preferences (for vibes only)</li>
                        <li>Email (if you choose to give it to us, e.g. for feedback)</li>
                    </ul>
                    <p className="mb-4">That’s it. No hidden tracking, no dark patterns. Questions? Hit us up at <a href="mailto:contact@techno-saas.com" className="text-purple-400 underline">hello@pickformedaddy.com</a>.</p>
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