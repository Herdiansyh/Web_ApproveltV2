<?php

namespace Database\Factories;

use App\Models\DocumentField;
use App\Models\Document;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DocumentField>
 */
class DocumentFieldFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = DocumentField::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'document_id' => Document::factory(),
            'name' => fake()->unique()->slug(2),
            'label' => fake()->words(2, true),
            'type' => fake()->randomElement(['text', 'textarea', 'date', 'select', 'number']),
            'required' => fake()->boolean(50), // 50% chance of being required
            'options_json' => null,
            'order' => fake()->numberBetween(1, 10),
        ];
    }

    /**
     * Indicate that the field is required.
     */
    public function required(): static
    {
        return $this->state(fn (array $attributes) => [
            'required' => true,
        ]);
    }

    /**
     * Indicate that the field is optional.
     */
    public function optional(): static
    {
        return $this->state(fn (array $attributes) => [
            'required' => false,
        ]);
    }

    /**
     * Create a text field.
     */
    public function text(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'text',
        ]);
    }

    /**
     * Create a date field.
     */
    public function date(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'date',
        ]);
    }

    /**
     * Create a select field with options.
     */
    public function select(array $options = []): static
    {
        $defaultOptions = $options ?: ['Option 1', 'Option 2', 'Option 3'];
        
        return $this->state(fn (array $attributes) => [
            'type' => 'select',
            'options_json' => json_encode($defaultOptions),
        ]);
    }
}
