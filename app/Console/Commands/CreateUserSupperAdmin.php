<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class CreateUserSupperAdmin extends Command
{
    /**
     * php artisan user:create-super-admin
     * php artisan user:create-super-admin --name="Admin" --email=admin@example.com --password=secret123
     */
    protected $signature = 'user:create-super-admin
                            {--name= : Full name}
                            {--email= : Email address}
                            {--password= : Password (min 8 characters)}';

    protected $description = 'Create a user and assign the super-admin role';

    public function handle(): int
    {
        $name = $this->option('name') ?: $this->ask('Name');
        $email = $this->option('email') ?: $this->ask('Email');
        $password = $this->option('password') ?: $this->secret('Password (min 8 characters)');

        $validator = Validator::make(
            compact('name', 'email', 'password'),
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255'],
                'password' => ['required', 'string', 'min:8'],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);

        $user = User::where('email', $email)->first();

        if ($user) {
            if (! $this->confirm("User {$email} already exists. Assign super-admin role to this user?", true)) {
                return self::SUCCESS;
            }
        } else {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
            ]);

            // Uncomment if your users table has email verification
            // $user->forceFill(['email_verified_at' => now()])->save();
        }

        $user->assignRole($role);

        $this->info("Super admin ready: {$user->email}");

        return self::SUCCESS;
    }
}