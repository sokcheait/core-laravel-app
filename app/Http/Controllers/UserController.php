<?php

namespace App\Http\Controllers;

use App\Jobs\ExportUsersJob;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    private const SORTABLE = ['name', 'email', 'created_at'];

    public function index(Request $request): Response
    {
        $input = $request->validate([
            'search'        => ['nullable', 'string', 'max:100'],
            'sort'          => ['nullable', 'in:'.implode(',', self::SORTABLE)],
            'direction'     => ['nullable', 'in:asc,desc'],
            'per_page'      => ['nullable', 'in:10,25,50'],
            'filter'        => ['nullable', 'array'],
            'filter.status' => ['nullable', 'in:verified,unverified'],
        ]);

        $search    = $input['search'] ?? '';
        $sort      = $input['sort'] ?? 'created_at';
        $direction = $input['direction'] ?? 'desc';
        $perPage   = (int) ($input['per_page'] ?? 10);
        $status    = $input['filter']['is_active'] ?? '';

        $users = User::query()
            ->when($search !== '', function ($query) use ($search) {
                $term = '%'.addcslashes($search, '%_\\').'%';

                $query->where(fn ($q) => $q
                    ->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term));
            })
            // ->when($status == true, fn ($q) => $q->where('is_active', 'like', $status))
            // ->when($status == false, fn ($q) => $q->where('is_active', 'like', $status))

            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'verified'   => $user->email_verified_at !== null,
                'created_at' => Carbon::parse($user->created_at)->format('M j, Y'),
            ]);

        return Inertia::render('Users/Index', [
            'users' => $users,
            'state' => [
                'search'    => $search,
                'sort'      => $sort,
                'direction' => $direction,
                'per_page'  => $perPage,
                'filters'   => ['status' => $status],
            ],
        ]);
    }

    public function create(): Response
    {
        $view = "Users/Create";
        $roles = Role::query()->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Role $role) => ['value' => (string) $role->id, 'label' => $role->name]);
        return Inertia::render($view,['roles'=>$roles]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'name_en'       => ['required', 'string', 'max:255'],
            'name_kh'       => ['required', 'string', 'max:255'],
            'email'         => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone'         => ['nullable', 'string', 'max:30'],
            'gender'        => ['nullable', Rule::in(['male', 'female'])],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'password'      => ['required', 'confirmed', Password::defaults()],
            'is_active'     => ['boolean'],
            'roles'         => ['nullable', 'array'],
            'roles.*'       => ['integer', Rule::exists('roles', 'id')],
            'avatar'        => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ]);
 
        $user = User::create(Arr::except($data, ['roles']));
        $user->syncRoles(array_map('intval', $data['roles'] ?? []));
        if ($request->hasFile('avatar')) {
            $user->addMediaFromRequest('avatar')->toMediaCollection('avatar');
        }
 
        return redirect('/users')->with('success', __('User created.'));
    }
    
    public function edit(User $user): Response
    {
        $view = "Users/Edit";
        $user->load('roles:id,name');

        return Inertia::render($view, [
            'user' => [
                'id'            => $user->id,
                'name'          => $user->name,
                'name_en'       => $user->name_en,
                'name_kh'       => $user->name_kh,
                'email'         => $user->email,
                'phone'         => $user->phone,
                'gender'        => $user->gender,
                'date_of_birth' => $user->date_of_birth?->format('Y-m-d'),
                'is_active'     => (bool) $user->is_active,
                'avatar_url'    => $user->getFirstMediaUrl('avatar', 'thumb') ?: null,
                'roles'         => $user->roles->pluck('id')->map(fn ($id) => (string) $id)->values(),
            ],
            'roles' => Role::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Role $role) => ['value' => (string) $role->id, 'label' => $role->name]),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'name_en'       => ['required', 'string', 'max:255'],
            'name_kh'       => ['required', 'string', 'max:255'],
            'email'         => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone'         => ['nullable', 'string', 'max:30'],
            'gender'        => ['nullable', Rule::in(['male', 'female'])],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'is_active'     => ['boolean'],
            'roles'         => ['nullable', 'array'],
            'roles.*'       => ['integer', Rule::exists('roles', 'id')],
            'avatar'        => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ]);

        $user->update(Arr::except($data, ['roles', 'avatar', 'remove_avatar']));
        $user->syncRoles(array_map('intval', $data['roles'] ?? []));

        if ($request->hasFile('avatar')) {
            $user->addMediaFromRequest('avatar')->toMediaCollection('avatar'); // replaces the old one
        } elseif ($request->boolean('remove_avatar')) {
            $user->clearMediaCollection('avatar');
        }

        return redirect('/users')->with('success', __('User updated.'));
    }

    public function destroy(int $id): RedirectResponse
    {
        if(!$id) return back()->with('error', __('User not found.'));

        User::query()
            ->where('id', $id)
            ->delete();

        return back()->with('success', __('User destroy.'));
    }

    public function bulkDelete(Request $request)
    {
        $data = $request->validate([
            'ids'       => ['required_without:all', 'array'],
            'ids.*'     => ['integer'],
            'all'       => ['sometimes', 'boolean'],
            'search'    => ['nullable', 'string'],
            'filters'   => ['nullable', 'array'],
        ]);

        $query = User::query();

        if ($request->boolean('all')) {
            // Same search/filters as your index() query. Reuse a scope if you have one.
            $query
                ->when($data['search'] ?? null, fn ($q, $s) => $q->where(function ($q) use ($s) {
                    $q->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%");
                }))
                ->when($data['filters']['role'] ?? null, fn ($q, $v) => $q->where('role', $v));
                // ...add the rest of your filters here
        } else {
            $query->whereIn('id', $data['ids']);
        }

        // Never let someone delete their own account
        $query->whereKeyNot($request->user()->id);

        $count = $query->count();

        $query->get()->each->delete(); // use ->delete() directly on $query to skip model events

        return back()->with('success', __(':count users deleted', ['count' => $count]));
    }

    public function export(Request $request)
    {
        ExportUsersJob::dispatch(
            $request->user()->id,
            (array) $request->input('ids', []),
            $request->boolean('all'),
            $request->input('search'),
            (array) $request->input('filters', []),
        );

        return back()->with('success', __('Export started. You will be notified when it is ready.'));
    }

    public function download(string $file)
    {
        abort_unless(preg_match('/^users-[\w-]+\.xlsx$/', $file), 404);

        $path = "exports/{$file}";

        abort_unless(Storage::disk('local')->exists($path), 404);

        return response()->download(Storage::disk('local')->path($path));
    }
}