<?php

/*
 * Web-triggered queue runner for hosts without SSH or cron (e.g. InfinityFree).
 * Deployed to htdocs/queue.php by deploy.sh.
 *
 * Setup:
 *  1. Add this line to the SERVER .env (core-laravel-app/.env):
 *       QUEUE_WEB_TOKEN=put-a-long-random-string-here
 *  2. Open:  https://yourdomain.com/queue.php?token=YOUR_TOKEN
 *     Process jobs:       ...?token=YOUR_TOKEN
 *     Run the scheduler:  ...?token=YOUR_TOKEN&task=schedule
 *     Run new migrations: ...?token=YOUR_TOKEN&task=migrate
 *  3. Call that URL from a free pinger (for example cron-job.org) every few minutes.
 */

use Illuminate\Contracts\Console\Kernel;

ini_set('display_errors', '0');
set_time_limit(30);

$base = __DIR__.'/core-laravel-app';

require $base.'/vendor/autoload.php';

$app = require_once $base.'/bootstrap/app.php';
$app->usePublicPath(__DIR__);

$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$expected = (string) env('QUEUE_WEB_TOKEN', '');
$given = (string) ($_GET['token'] ?? '');

if ($expected === '' || ! hash_equals($expected, $given)) {
    http_response_code(403);
    exit('Forbidden');
}

header('Content-Type: text/plain; charset=utf-8');

$task = $_GET['task'] ?? 'queue';

try {
    if ($task === 'schedule') {
        $kernel->call('schedule:run');
    }elseif ($task === 'migrate') {
        $kernel->call('migrate');
    } 
    else {
        $kernel->call('queue:work', [
            '--stop-when-empty' => true,
            '--max-time' => 20,
            '--tries' => 3,
        ]);
    }

    echo "ok\n".$kernel->output();
} catch (Throwable $e) {
    http_response_code(500);
    echo 'error: '.$e->getMessage();
}