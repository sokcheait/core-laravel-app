<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Dashboard', [
            'stats' => [
                ['label' => 'Total users',  'value' => User::count()],
                ['label' => 'Member since', 'value' => $request->user()->created_at->format('M Y')],
                ['label' => 'Account ID',   'value' => $request->user()->id],
            ],
        ]);
    }
}