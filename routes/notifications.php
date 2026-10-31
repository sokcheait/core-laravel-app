<?php

use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll']);
    Route::delete('/notifications', [NotificationController::class, 'clear']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'read']);
});