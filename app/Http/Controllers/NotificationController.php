<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function read(Request $request, string $id)
    {
        $request->user()->notifications()->whereKey($id)->first()?->markAsRead();

        return back(303);
    }

    public function readAll(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return back(303);
    }

    public function destroy(Request $request, string $id)
    {
        $request->user()->notifications()->whereKey($id)->delete();

        return back(303);
    }

    public function clear(Request $request)
    {
        $request->user()->notifications()->delete();

        return back(303);
    }
}