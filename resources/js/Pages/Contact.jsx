import React from 'react'
import { Head } from '@inertiajs/react'

const Privacy = () => {
    return (
        <>
            <Head
                title="PickForMeDaddy | Contact Us"
                description="Got a bug to report, a feature request, or just wanna say hi? We’d love to hear from you."
            />
            <section className="min-h-screen w-full bg-gray-900 text-white container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-x-hidden">
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 overflow-x-hidden max-w-3xl">
                    <h1 className="text-3xl font-bold text-white mb-6">Contact Us</h1>
                    <p className="mb-4">Got a bug to report, a feature request, or just wanna say hi? We’d love to hear from you.</p>
                    <ul className="mb-4">
                        <li><strong>Email:</strong> <a href="mailto:contact@techno-saas.com" className="text-purple-400 underline">hello@pickformedaddy.com</a></li>
                        <li><strong>Twitter/X:</strong> <a href="https://twitter.com/technoSaas" className="text-purple-400 underline">@pickformedaddy</a></li>
                    </ul>
                    <p>We usually reply within a day unless we’re in a deep binge session.</p>
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