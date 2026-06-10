<?php

namespace App\Enums;

enum FormFieldType: string
{
    case Heading = 'heading';
    case Text = 'text';
    case Textarea = 'textarea';
    case Email = 'email';
    case Phone = 'phone';
    case Number = 'number';
    case Date = 'date';
    case Select = 'select';
    case Multiselect = 'multiselect';
    case Checkbox = 'checkbox';
    case Switch = 'switch';
}
