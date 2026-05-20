<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Salon / beauty business verticals
    |--------------------------------------------------------------------------
    */
    'types' => [
        'hair_salon' => [
            'label' => 'Hair Salon',
            'icon' => 'scissors',
            'description' => 'Cuts, color, styling, and hair treatments',
            'default_categories' => ['Haircuts & Styling', 'Color & Highlights', 'Hair Treatments'],
            'suggested_tagline' => 'Your destination for beautiful hair',
            'default_services' => [
                ['category_index' => 0, 'name' => 'Signature Cut & Style', 'description' => 'Consultation, wash, precision cut, and blow-dry finish.', 'duration_minutes' => 45, 'price_cents' => 6500],
                ['category_index' => 1, 'name' => 'Balayage Color', 'description' => 'Hand-painted highlights with toner and styling.', 'duration_minutes' => 150, 'price_cents' => 18500],
            ],
        ],
        'spa' => [
            'label' => 'Spa',
            'icon' => 'bath',
            'description' => 'Full-service spa, wellness, and relaxation',
            'default_categories' => ['Spa Packages', 'Body Treatments', 'Wellness & Relaxation'],
            'suggested_tagline' => 'Relax, restore, renew',
            'default_services' => [
                ['category_index' => 0, 'name' => 'Relaxation Spa Day', 'description' => 'Half-day package with massage, facial, and lounge access.', 'duration_minutes' => 240, 'price_cents' => 22000],
                ['category_index' => 1, 'name' => 'Detox Body Wrap', 'description' => 'Exfoliation, nourishing wrap, and scalp massage.', 'duration_minutes' => 75, 'price_cents' => 12000],
            ],
        ],
        'nail_tech' => [
            'label' => 'Nail Tech',
            'icon' => 'hand',
            'description' => 'Manicures, pedicures, and nail art',
            'default_categories' => ['Manicures', 'Pedicures', 'Nail Art & Extensions'],
            'suggested_tagline' => 'Nails done right',
            'default_services' => [
                ['category_index' => 0, 'name' => 'Gel Manicure', 'description' => 'Shape, cuticle care, gel polish, and nourishing finish.', 'duration_minutes' => 60, 'price_cents' => 5500],
                ['category_index' => 1, 'name' => 'Luxury Pedicure', 'description' => 'Soak, exfoliation, massage, and polish of your choice.', 'duration_minutes' => 75, 'price_cents' => 7200],
            ],
        ],
        'makeup' => [
            'label' => 'Makeup',
            'icon' => 'palette',
            'description' => 'Bridal, events, and professional makeup',
            'default_categories' => ['Bridal & Events', 'Everyday Makeup', 'Makeup Lessons'],
            'suggested_tagline' => 'Look your best for every occasion',
            'default_services' => [
                ['category_index' => 0, 'name' => 'Bridal Makeup', 'description' => 'Trial-ready application with long-wear products and lashes.', 'duration_minutes' => 90, 'price_cents' => 15000],
                ['category_index' => 1, 'name' => 'Event Glam', 'description' => 'Full-face makeup for parties, photos, and special nights.', 'duration_minutes' => 60, 'price_cents' => 9500],
            ],
        ],
        'barbershop' => [
            'label' => 'Barbershop',
            'icon' => 'user',
            'description' => 'Men’s cuts, beard grooming, and shaves',
            'default_categories' => ['Haircuts', 'Beard & Shave', 'Grooming Packages'],
            'suggested_tagline' => 'Classic cuts, modern style',
            'default_services' => [
                ['category_index' => 0, 'name' => 'Classic Haircut', 'description' => 'Consultation, clipper and scissor work, hot towel finish.', 'duration_minutes' => 35, 'price_cents' => 3500],
                ['category_index' => 1, 'name' => 'Beard Trim & Shape', 'description' => 'Line-up, beard sculpt, and conditioning oil.', 'duration_minutes' => 25, 'price_cents' => 2500],
            ],
        ],
        'massage' => [
            'label' => 'Massage',
            'icon' => 'waves',
            'description' => 'Therapeutic and relaxation massage',
            'default_categories' => ['Swedish & Relaxation', 'Deep Tissue', 'Specialty Massage'],
            'suggested_tagline' => 'Therapeutic touch, total relaxation',
            'default_services' => [
                ['category_index' => 0, 'name' => 'Swedish Massage', 'description' => 'Full-body relaxation with medium pressure.', 'duration_minutes' => 60, 'price_cents' => 9000],
                ['category_index' => 1, 'name' => 'Deep Tissue Massage', 'description' => 'Focused work on tension areas and chronic tightness.', 'duration_minutes' => 75, 'price_cents' => 11000],
            ],
        ],
        'facial' => [
            'label' => 'Facial',
            'icon' => 'scan-face',
            'description' => 'Skincare, facials, and skin treatments',
            'default_categories' => ['Classic Facials', 'Advanced Skin Treatments', 'Peels & Add-ons'],
            'suggested_tagline' => 'Healthy skin, glowing results',
            'default_services' => [
                ['category_index' => 0, 'name' => 'Classic Glow Facial', 'description' => 'Cleanse, exfoliate, mask, and hydrating finish.', 'duration_minutes' => 50, 'price_cents' => 8500],
                ['category_index' => 1, 'name' => 'Anti-Aging Treatment', 'description' => 'Serums, LED therapy, and firming massage.', 'duration_minutes' => 70, 'price_cents' => 13000],
            ],
        ],
        'waxing' => [
            'label' => 'Waxing',
            'icon' => 'droplets',
            'description' => 'Body and facial waxing services',
            'default_categories' => ['Body Waxing', 'Facial Waxing', 'Waxing Packages'],
            'suggested_tagline' => 'Smooth, confident, cared for',
            'default_services' => [
                ['category_index' => 0, 'name' => 'Full Leg Wax', 'description' => 'Premium hard wax for long-lasting smoothness.', 'duration_minutes' => 45, 'price_cents' => 5500],
                ['category_index' => 1, 'name' => 'Brow Shape & Wax', 'description' => 'Custom brow mapping with gentle wax and trim.', 'duration_minutes' => 20, 'price_cents' => 2800],
            ],
        ],
    ],

];
