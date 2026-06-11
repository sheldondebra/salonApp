<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

if (config('ops-monitor.enabled')) {
    require __DIR__.'/ops.php';
}
