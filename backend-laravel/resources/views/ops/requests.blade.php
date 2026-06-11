@extends('ops.layout')

@section('title', 'Requests')

@section('content')
    @include('ops.partials.request-table', [
        'title' => 'All API requests',
        'requests' => $requests,
        'filters' => $filters,
        'showStatusFilter' => true,
    ])
@endsection
