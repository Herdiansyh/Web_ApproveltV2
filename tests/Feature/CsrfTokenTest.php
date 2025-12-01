<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CsrfTokenTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that CSRF token endpoint returns a valid token
     */
    public function test_csrf_token_endpoint_returns_token(): void
    {
        $response = $this->get('/csrf-token');

        $response->assertStatus(200)
                ->assertJsonStructure(['token']);

        $this->assertNotEmpty($response->json('token'));
    }

    /**
     * Test that login response includes new CSRF token header
     */
    public function test_login_includes_csrf_token_header(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect();
        $this->assertTrue($response->headers->has('X-CSRF-TOKEN'));
        $this->assertNotEmpty($response->headers->get('X-CSRF-TOKEN'));
    }

    /**
     * Test CSRF token mismatch scenario and refresh
     */
    public function test_csrf_token_refresh_after_login(): void
    {
        $user1 = User::factory()->create([
            'password' => bcrypt('password'),
        ]);

        $user2 = User::factory()->create([
            'password' => bcrypt('password'),
            'email' => 'different@example.com',
        ]);

        // Simulate first login
        $response1 = $this->post('/login', [
            'email' => $user1->email,
            'password' => 'password',
        ]);

        $token1 = $response1->headers->get('X-CSRF-TOKEN');
        $this->assertNotEmpty($token1);

        // Logout
        $this->post('/logout');

        // Simulate second login with different user (same browser scenario)
        $response2 = $this->post('/login', [
            'email' => $user2->email,
            'password' => 'password',
        ]);

        $token2 = $response2->headers->get('X-CSRF-TOKEN');
        $this->assertNotEmpty($token2);

        // Tokens should be different for different sessions
        $this->assertNotEquals($token1, $token2);
    }

    /**
     * Test that CSRF token endpoint works with authenticated user
     */
    public function test_csrf_token_endpoint_with_authenticated_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user);

        $response = $this->get('/csrf-token');

        $response->assertStatus(200)
                ->assertJsonStructure(['token']);

        $this->assertNotEmpty($response->json('token'));
    }

    /**
     * Test that old CSRF token becomes invalid after session regeneration
     */
    public function test_old_csrf_token_invalid_after_session_regeneration(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
        ]);

        // Get initial token
        $initialResponse = $this->get('/csrf-token');
        $initialToken = $initialResponse->json('token');

        // Login (this regenerates session)
        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        // Get new token after login
        $newResponse = $this->get('/csrf-token');
        $newToken = $newResponse->json('token');

        // Tokens should be different
        $this->assertNotEquals($initialToken, $newToken);
    }
}
