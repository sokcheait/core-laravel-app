<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Keep any other shared props you already have (flash, name, quote, etc.).
     * Only the `locale` and `translations` entries are new.
     */
    public function share(Request $request): array
    {
        // Read the locale straight from the session, so this works
        // no matter where SetLocale sits in the middleware order.
        $locale = $request->session()->get('locale', config('app.locale'));
        $user = $request->user();

        if (! in_array($locale, SetLocale::SUPPORTED, true)) {
            $locale = config('app.locale');
        }

        app()->setLocale($locale);

        $file = lang_path("{$locale}.json");
        $translations = is_file($file) ? json_decode(file_get_contents($file), true) : null;

        return [
            ...parent::share($request),

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info'    => fn () => $request->session()->get('info'),
            ],
            'notifications' => fn () => $request->user() ? [
                'unread' => $request->user()->unreadNotifications()->count(),
                'items'  => $request->user()->notifications()->latest()->limit(10)->get()
                    ->map(fn ($n) => [
                        'id'         => $n->id,
                        'title'      => $n->data['title'] ?? '',
                        'body'       => $n->data['body'] ?? null,
                        'url'        => $n->data['url'] ?? null,
                        'type'       => $n->data['type'] ?? 'info',
                        'read'       => $n->read_at !== null,
                        'created_at' => $n->created_at->diffForHumans(),
                    ]),
            ] : null,
            
            'auth' => [
                'user' => $request->user()
                    ? [
                        ...$request->user()->only('id', 'name', 'email'),
                        'avatar_url' => $request->user()->getFirstMediaUrl('avatar', 'thumb') ?: null,
                    ]
                    : null,
            ],
            'roles' => $user ? $user->getRoleNames() : [],
            'permissions' => $user ? $user->getAllPermissions()->pluck('name') : [],
            'is_super_admin' => $user?->hasRole('super-admin') ?? false,

            'locale' => $locale,
            // (object) makes an empty list serialise as {} instead of []
            'translations' => $translations ?: (object) [],
        ];
    }
}