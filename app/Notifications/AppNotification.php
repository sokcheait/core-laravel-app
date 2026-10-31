<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class AppNotification extends Notification
{
    public function __construct(
        private string $title,
        private ?string $body = null,
        private ?string $url = null,
        private string $type = 'info', // info | success | warning | danger
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => $this->title,
            'body'  => $this->body,
            'url'   => $this->url,
            'type'  => $this->type,
        ];
    }
}