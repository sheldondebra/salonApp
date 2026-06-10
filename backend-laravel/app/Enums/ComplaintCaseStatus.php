<?php

namespace App\Enums;

enum ComplaintCaseStatus: string
{
    case Open = 'open';
    case InProgress = 'in_progress';
    case Resolved = 'resolved';
    case Closed = 'closed';
}
