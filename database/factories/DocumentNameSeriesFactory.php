<?php

namespace Database\Factories;

use App\Models\Document;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DocumentNameSeries>
 */
class DocumentNameSeriesFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'document_id' => Document::factory(),
            'series_pattern' => 'yyyy-mm-####',
            'prefix' => $this->faker->unique()->lexify('???-'),
            'current_number' => $this->faker->numberBetween(0, 100),
            'reset_type' => $this->faker->randomElement(['none', 'monthly', 'yearly']),
            'last_reset_at' => $this->faker->optional()->dateTimeThisYear(),
        ];
    }
}
