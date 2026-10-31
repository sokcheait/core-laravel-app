<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Add or remove resources here. Permissions are named "{resource}.{action}"
        $resources = ['users', 'roles'];
        $actions = ['view', 'create', 'edit', 'delete'];

        foreach ($resources as $resource) {
            foreach ($actions as $action) {
                Permission::firstOrCreate([
                    'name' => "{$resource}.{$action}",
                    'guard_name' => 'web',
                ]);
            }
        }

        // Super admin: bypasses every check through Gate::before (see AppServiceProvider)
        Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);

        // Example role with limited permissions
        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        $manager->syncPermissions(['users.view', 'users.create', 'users.edit']);
    }
}