<?php

namespace Database\Factories;

use App\Models\SubmissionWorkflowStep;
use App\Models\Submission;
use App\Models\WorkflowStep;
use App\Models\Division;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SubmissionWorkflowStep>
 */
class SubmissionWorkflowStepFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = SubmissionWorkflowStep::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'submission_id' => Submission::factory(),
            'division_id' => Division::factory(),
            'step_order' => fake()->numberBetween(1, 5),
            'status' => 'pending',
        ];
    }

    /**
     * Indicate that the step is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'approved_at' => now(),
        ]);
    }

    /**
     * Indicate that the step is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'rejected_at' => now(),
        ]);
    }
}
