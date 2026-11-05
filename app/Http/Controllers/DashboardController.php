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

        $users = User::with('roles:id,name')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (User $user) => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->roles->pluck('name')->first(),
                'time'  => $user->created_at->diffForHumans(),
                'avatar_url' => $user->getFirstMedia('avatar')?->getTemporaryUrl(now()->addMinutes(30), 'thumb')??null
            ]);

        return Inertia::render('Dashboard', [
            'stats' => [
                ['label' => 'Total users',  'value' => $userCount],
                ['label' => 'Roles',        'value' => $roles->count()],
                ['label' => 'Permissions',  'value' => $permissionCount],
                ['label' => 'Account ID',   'value' => $me->id, 'animate' => false],
            ],
            'roles'           => $roles,
            'userCount'       => $userCount,
            'permissionCount' => $permissionCount,
            'users'           => $users,
        ]);
    }
}