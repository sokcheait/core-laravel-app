<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

Route::post('/locale', LocaleController::class)->name('language.switch');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    // Route::get('/users', [UserController::class, 'index'])->name('users.index');
    // Route::get('/users/create', [UserController::class, 'create']);
    // Route::post('/users', [UserController::class, 'store']);
    // Route::get('/users/edit', [UserController::class, 'edit']);

    Route::resource('/users',UserController::class)->except(['show']);
    Route::post('/users/bulk-delete', [UserController::class, 'bulkDelete']);
    // Route::match(['get', 'post'], '/users/export', [UserController::class, 'export']);
    Route::get('/users/export', [UserController::class, 'export']);
    Route::get('/users/export/{file}', [UserController::class, 'download'])
    ->name('users.export.download');
    // ->middleware('signed');

    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/password', [ProfileController::class, 'updatePassword'])->name('password.update');
    
    
    Route::get('roles', [RoleController::class, 'index'])->middleware('permission:roles.view');
    Route::get('roles/create', [RoleController::class, 'create'])->middleware('permission:roles.create');
    Route::post('roles', [RoleController::class, 'store'])->middleware('permission:roles.create');
    Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->middleware('permission:roles.edit');
    Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('permission:roles.edit');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:roles.delete');
    
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);

    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store']);
});

require __DIR__.'/notifications.php';
