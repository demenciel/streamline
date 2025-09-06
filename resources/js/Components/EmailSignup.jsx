import React, { useState, useEffect } from "react"
import { useForm } from "@inertiajs/react"
import { Input } from "@/Components/ui/input"
import { Button } from "@/Components/ui/button"
import { useSnackbar } from "@/Hooks/useSnack"

export default function EmailSignup({
    title = "Get weekly mood-based picks",
    subtitle = "Top 5 watch ideas for your vibe and region.",
    ctaLabel = "Subscribe",
    successMessage = "You're on the list! Check your inbox."
}) {
    const { show } = useSnackbar()
    const [success, setSuccess] = useState(false)
    const [genericError, setGenericError] = useState(null)

    const { data, setData, post, processing, errors, reset } = useForm({
        email: ""
    })

    /* useEffect(() => {
        // display snack
        show(successMessage, { variant: "success", duration: 3500 })
    }, []) */

    const action = typeof route === "function"
        ? route("newsletter.subscribe")
        : "/newsletter/subscribe"

    const onSubmit = (e) => {
        e.preventDefault()
        setGenericError(null)
        post(action, {
            preserveScroll: true,
            onSuccess: () => {
                setSuccess(true)
                reset("email")
                show(successMessage, { variant: "success", duration: 3500 })
            },
            onError: (err) => {
                // Prefer field-level error if provided, else show generic
                setGenericError(err?.email || "Something went wrong.")
                show(err?.email || "Something went wrong.", { variant: "error", duration: 4000 })
            }
        })
    }

    return (
        <div className="w-full">
            <div className="mb-3">
                <h3 className="text-lg sm:text-xl font-semibold text-white">{title}</h3>
                {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
            </div>

            {success ? (
                <div className="text-green-400 text-sm">{successMessage}</div>
            ) : (
                <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                        <Input
                            type="email"
                            required
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            placeholder="your@email.com"
                            className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 w-full"
                            aria-invalid={Boolean(errors.email)}
                            aria-describedby={errors.email ? "email-error" : undefined}
                        />
                        {errors.email && (
                            <div id="email-error" className="text-red-400 text-xs mt-1">
                                {errors.email}
                            </div>
                        )}
                    </div>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="bg-purple-600 hover:bg-purple-500 text-white"
                    >
                        {processing ? "Submitting..." : ctaLabel}
                    </Button>
                </form>
            )}

            {genericError && <div className="text-red-400 text-sm mt-2">{genericError}</div>}
        </div>
    )
}