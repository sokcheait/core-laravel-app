<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$base = __DIR__.'/core-laravel-app';

if (file_exists($maintenance = $base.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $base.'/vendor/autoload.php';

// --- Self-healing: remove a stale package cache copied from a dev machine ---
// If bootstrap/cache/packages.php lists a provider class that does not exist
// on this server (for example Laravel\Boost\BoostServiceProvider, a dev-only
// package), delete the cache files. Laravel rebuilds them from this server's
// own vendor folder on the same request.
$cacheDir = $base.'/bootstrap/cache';
if (is_file($cacheDir.'/packages.php')) {
    $manifest = @include $cacheDir.'/packages.php';
    $stale = false;

    if (is_array($manifest)) {
        foreach ($manifest as $package) {
            if (! is_array($package)) {
                continue;
            }
            foreach ((array) ($package['providers'] ?? []) as $provider) {
                if (is_string($provider) && ! class_exists($provider)) {
                    $stale = true;
                    break 2;
                }
            }
        }
    }

    if ($stale) {
        @unlink($cacheDir.'/packages.php');
        @unlink($cacheDir.'/services.php');
    }
}

$app = require_once $base.'/bootstrap/app.php';

// public files live in htdocs itself (no public/ folder on this host)
$app->usePublicPath(__DIR__);

if (method_exists($app, 'handleRequest')) {
    $app->handleRequest(Request::capture());
} else {
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    $response = $kernel->handle($request = Request::capture());
    $response->send();
    $kernel->terminate($request, $response);
}