<?php

namespace App\Jobs;

use App\Exports\UsersExport;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class ExportUsersJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $userId,
        public array $ids,
        public bool $all,
        public ?string $search,
        public array $filters,
    ) {}

    public function handle(): void
    {
        $name = 'users-'.now()->format('Ymd-His').'-'.Str::random(6).'.xlsx';

        Excel::store(
            new UsersExport($this->ids, $this->all, $this->search, $this->filters),
            "exports/{$name}",
            'local',
        );

        $url = URL::temporarySignedRoute('users.export.download', now()->addDay(), ['file' => $name]);

        User::find($this->userId)?->notify(new AppNotification(
            'Export ready',
            'Your Excel file is ready to download. The link expires in 24 hours.',
            $url,
            'success',
        ));
    }

    public function failed(\Throwable $e): void
    {
        User::find($this->userId)?->notify(new AppNotification(
            'Export failed',
            'Your Excel export could not be generated.',
            null,
            'danger',
        ));
    }
}