<?php

namespace Database\Factories;

use App\Models\WorkflowStep;
use App\Models\Workflow;
use App\Models\Division;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WorkflowStep>
 */
class WorkflowStepFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = WorkflowStep::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workflow_id' => Workflow::factory(),
            'division_id' => Division::factory(),
            'step_order' => fake()->numberBetween(1, 5),
            'is_final_step' => false,
        ];
    }

    /**
     * Indicate that this is the final step.
     */
    public function final(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_final_step' => true,
        ]);
    }
}
