<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $me = $request->user();

        $userCount = User::count();
        $permissionCount = Permission::count();

        $roles = Role::query()
            ->withCount(['users', 'permissions'])
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role) => [
                'id'    => $role->id,
                'name'  => $role->name,
                'users' => $role->users_count,
                'perms' => $role->permissions_count,
            ]);

        $recentUsers = User::latest()
            ->take(5)
            ->get(['id', 'name', 'email', 'created_at'])
            ->map(fn (User $user) => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'time'  => $user->created_at->diffForHumans(),
            ]);

        return Inertia::render('Dashboard', [
            'stats' => [
                ['label' => 'Total users',  'value' => $userCount],
                ['label' => 'Roles',        'value' => $roles->count()],
                ['label' => 'Permissions',  'value' => $permissionCount],
                // ['label' => 'Member since', 'value' => $me->created_at->format('M Y')],
                ['label' => 'Account ID',   'value' => $me->id, 'animate' => false],
            ],
            'roles'           => $roles,
            'userCount'       => $userCount,
            'permissionCount' => $permissionCount,
            'recentUsers'     => $recentUsers,
        ]);
    }
}