<?php

namespace Database\Seeders;

use App\Models\FormTemplateLibrary;
use Illuminate\Database\Seeder;

class FormTemplateLibrarySeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'slug' => 'client-intake',
                'name' => 'Client intake form',
                'category' => 'intake',
                'description' => 'Collect basic client details and health notes before first visit.',
                'sort_order' => 1,
                'fields' => [
                    ['field_type' => 'heading', 'label' => 'About you', 'sort_order' => 0],
                    ['field_type' => 'text', 'label' => 'Full name', 'field_key' => 'full_name', 'is_required' => true, 'sort_order' => 1],
                    ['field_type' => 'email', 'label' => 'Email', 'field_key' => 'email', 'is_required' => true, 'sort_order' => 2],
                    ['field_type' => 'phone', 'label' => 'Phone', 'field_key' => 'phone', 'sort_order' => 3],
                    ['field_type' => 'textarea', 'label' => 'Allergies or sensitivities', 'field_key' => 'allergies', 'help_text' => 'List any known reactions to products.', 'sort_order' => 4],
                    ['field_type' => 'checkbox', 'label' => 'I confirm the information provided is accurate', 'field_key' => 'confirm_accurate', 'is_required' => true, 'sort_order' => 5],
                ],
            ],
            [
                'slug' => 'patch-test',
                'name' => 'Patch test record',
                'category' => 'compliance',
                'description' => 'Document patch test product, date, and result.',
                'sort_order' => 2,
                'fields' => [
                    ['field_type' => 'select', 'label' => 'Product tested', 'field_key' => 'product', 'is_required' => true, 'options' => ['choices' => ['Hair color', 'Brow tint', 'Lash tint', 'Other']], 'sort_order' => 0],
                    ['field_type' => 'date', 'label' => 'Test date', 'field_key' => 'test_date', 'is_required' => true, 'sort_order' => 1],
                    ['field_type' => 'select', 'label' => 'Result', 'field_key' => 'result', 'is_required' => true, 'options' => ['choices' => ['Passed', 'Failed', 'Pending']], 'sort_order' => 2],
                    ['field_type' => 'textarea', 'label' => 'Notes', 'field_key' => 'notes', 'sort_order' => 3],
                ],
            ],
            [
                'slug' => 'pre-appointment',
                'name' => 'Pre-appointment checklist',
                'category' => 'booking',
                'description' => 'Quick health and preference questions before the appointment.',
                'sort_order' => 3,
                'fields' => [
                    ['field_type' => 'switch', 'label' => 'Any skin irritation today?', 'field_key' => 'skin_irritation', 'sort_order' => 0],
                    ['field_type' => 'textarea', 'label' => 'Describe irritation', 'field_key' => 'irritation_details', 'visible_when' => ['field_key' => 'skin_irritation', 'operator' => 'equals', 'value' => true], 'sort_order' => 1],
                    ['field_type' => 'select', 'label' => 'Preferred contact method', 'field_key' => 'contact_method', 'options' => ['choices' => ['SMS', 'Email', 'Phone call']], 'sort_order' => 2],
                    ['field_type' => 'multiselect', 'label' => 'Services of interest', 'field_key' => 'services_interest', 'options' => ['choices' => ['Hair', 'Nails', 'Skin', 'Makeup']], 'sort_order' => 3],
                ],
            ],
        ];

        foreach ($templates as $row) {
            $entry = FormTemplateLibrary::query()->firstOrNew(['slug' => $row['slug']]);
            $entry->name = $row['name'];
            $entry->category = $row['category'];
            $entry->description = $row['description'];
            $entry->fields = $row['fields'];
            $entry->sort_order = $row['sort_order'];
            $entry->is_active = true;
            $entry->save();
        }
    }
}
