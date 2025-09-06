<?php

namespace App\Http\Controllers;

use App\Models\NewsletterSubscribe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewsletterSubscribeMail;
use Illuminate\Support\Facades\DB;

class NewsletterController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:newsletter_subscribe,email'],
        ]);
        DB::beginTransaction();
        try {
            NewsletterSubscribe::create($validated);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['email' => 'Failed to subscribe to newsletter']);
        }

        Mail::to($validated['email'])->send(new NewsletterSubscribeMail($validated['email']));
        // delete the email from the request
        DB::commit();
        return back();
    }
}
