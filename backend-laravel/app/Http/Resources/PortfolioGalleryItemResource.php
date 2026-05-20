<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PortfolioGalleryItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'title' => $this->title,
            'before_image_url' => $this->before_image_url,
            'after_image_url' => $this->after_image_url,
            'caption' => $this->caption,
            'sort_order' => $this->sort_order,
            'is_published' => $this->is_published,
            'service_id' => $this->service_id,
        ];
    }
}
