<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    private const PROTECTED_ROLE = 'super-admin';

    private const SORTABLE = ['name', 'permissions_count', 'users_count', 'created_at', 'updated_at'];

    public function index(Request $request): Response
    {
        $input = $request->validate([
            'search'        => ['nullable', 'string', 'max:100'],
            'sort'          => ['nullable', 'in:' . implode(',', self::SORTABLE)],
            'direction'     => ['nullable', 'in:asc,desc'],
            'per_page'      => ['nullable', 'in:10,25,50'],
            'filter'        => ['nullable', 'array'],
            'filter.from'   => ['nullable', 'date'],
            'filter.to'     => ['nullable', 'date'],
            'filter.name'   => ['nullable', 'string', 'max:100'],
        ]);

        $search    = $input['search'] ?? '';
        $sort      = $input['sort'] ?? 'created_at';
        $direction = $input['direction'] ?? 'desc';
        $perPage   = (int) ($input['per_page'] ?? 10);
        $from      = $input['filter']['from'] ?? '';
        $to        = $input['filter']['to'] ?? '';
        $name      = $input['filter']['name'] ?? '';

        $like = fn (string $v) => '%' . addcslashes($v, '%_\\') . '%';

        $roles = Role::query()
            ->withCount(['permissions', 'users'])
            ->when($search !== '', fn ($q) => $q->where('name', 'like', $like($search)))
            ->when($name !== '', fn ($q) => $q->where('name', 'like', $like($name)))
            ->when($from !== '', fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to !== '', fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Role $role) => [
                'id'                => $role->id,
                'name'              => $role->name,
                'permissions_count' => $role->permissions_count,
                'users_count'       => $role->users_count,
                'created_at'        => $role->created_at->format('M j, Y'),
                'updated_at'        => $role->updated_at->format('M j, Y'),
            ]);

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'state' => [
                'search'    => $search,
                'sort'      => $sort,
                'direction' => $direction,
                'per_page'  => $perPage,
                'filters'   => ['from' => $from, 'to' => $to, 'name' => $name],
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Roles/Create', [
            'groups' => $this->permissionGroups(),
        ]);
    }

    public function store(RoleRequest $request): RedirectResponse
    {
        $role = Role::create(['name' => $request->name, 'guard_name' => 'web']);
        $role->syncPermissions($request->input('permissions', []));

        return redirect('/roles')->with('success', 'Role created.');
    }

    public function edit(Role $role): Response
    {
        return Inertia::render('Roles/Edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('id')->values(),
            ],
            'groups' => $this->permissionGroups(),
        ]);
    }

    public function update(RoleRequest $request, Role $role): RedirectResponse
    {
        if ($role->name === self::PROTECTED_ROLE) {
            return back()->with('error', 'This role cannot be edited.');
        }

        $role->update(['name' => $request->name]);
        $role->syncPermissions($request->input('permissions', []));

        return redirect('/roles')->with('success', 'Role updated.');
    }

    /** Bulk delete: DELETE /roles with { ids: [1, 2, 3] } */
    public function destroy(Request $request): RedirectResponse
    {
        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ])['ids'];

        $roles = Role::query()
            ->whereIn('id', $ids)
            ->where('name', '!=', self::PROTECTED_ROLE)
            ->withCount('users')
            ->get();

        $inUse = $roles->where('users_count', '>', 0);

        if ($inUse->isNotEmpty()) {
            return back()->with('error', 'Assigned to users: ' . $inUse->pluck('name')->join(', '));
        }

        $roles->each->delete();

        return back()->with('success', 'Deleted.');
    }

    /** Permissions grouped by resource: { users: [{id, name}], roles: [...] } */
    private function permissionGroups()
    {
        return Permission::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->groupBy(fn ($p) => explode('.', $p->name)[0])
            ->map(fn ($group) => $group->map(fn ($p) => ['id' => $p->id, 'name' => $p->name])->values());
    }
}