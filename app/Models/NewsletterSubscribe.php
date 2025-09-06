<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsletterSubscribe extends Model
{
    protected $table = 'newsletter_subscribe';
    protected $fillable = ['email'];

}
