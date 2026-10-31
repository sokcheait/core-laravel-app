<?php

namespace App\Exports;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class UsersExport implements FromQuery, WithHeadings, WithMapping
{
    public function __construct(
        private array $ids,
        private bool $all,
        private ?string $search,
        private array $filters,
    ) {}

    public function query(): Builder
    {
        $query = User::query();

        if (! $this->all) {
            return $query->whereIn('id', array_map('intval', $this->ids));
        }

        if ($this->search) {
            $s = $this->search;
            $query->where(fn ($q) => $q->where('name', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%"));
        }

        foreach ($this->filters as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            match ($key) {
                'from'      => $query->whereDate('created_at', '>=', $value),
                'to'        => $query->whereDate('created_at', '<=', $value),
                'is_active' => $value === '1'
                                ? $query->whereNotNull('email_verified_at')
                                : $query->whereNull('email_verified_at'),
                'email'     => $query->where('email', 'like', "%{$value}%"),
                'name'      => $query->where('name', 'like', "%{$value}%"),
                default     => null,
            };
        }

        return $query;
    }

    public function headings(): array
    {
        return ['ID', 'Name', 'Email', 'Joined', 'Updated at'];
    }

    /** @param User $user */
    public function map($user): array
    {
        return [
            $user->id,
            $user->name,
            $user->email,
            $user->created_at?->format('Y-m-d H:i:s'),
            $user->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}