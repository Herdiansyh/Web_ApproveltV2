<?php

namespace App\Services;

use App\Models\SubdivisionPermission;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

/**
 * Service untuk mengelola permission caching
 * Menghindari query berulang pada setiap request
 */
class PermissionCacheService
{
    // Cache key prefix
    private const CACHE_PREFIX = 'subdivision_permission_';
    private const CACHE_TTL = 3600; // 1 jam

    /**
     * Ambil permission untuk subdivision, dengan caching
     * Menghindari repeated queries ke tabel subdivisions_permissions
     */
    public function getPermissionForSubdivision(int $subdivisionId): ?SubdivisionPermission
    {
        $cacheKey = self::CACHE_PREFIX . $subdivisionId;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($subdivisionId) {
            return SubdivisionPermission::where('subdivision_id', $subdivisionId)
                ->first();
        });
    }

    /**
     * Cek single permission untuk subdivision, dengan caching
     * Lebih efisien daripada ambil object lengkap hanya untuk satu field
     */
    public function hasPermission(int $subdivisionId, string $permission): bool
    {
        $perms = $this->getPermissionForSubdivision($subdivisionId);
        if (!$perms) {
            return false;
        }

        return (bool) $perms->$permission;
    }

    /**
     * Ambil multiple permissions sekaligus untuk subdivision
     */
    public function getMultiplePermissions(int $subdivisionId, array $permissions): array
    {
        $perms = $this->getPermissionForSubdivision($subdivisionId);
        if (!$perms) {
            return array_fill_keys($permissions, false);
        }

        $result = [];
        foreach ($permissions as $perm) {
            $result[$perm] = (bool) $perms->$perm;
        }

        return $result;
    }

    /**
     * Flush cache untuk subdivision tertentu (digunakan saat update permission)
     */
    public function flushSubdivisionPermissionCache(int $subdivisionId): void
    {
        Cache::forget(self::CACHE_PREFIX . $subdivisionId);
    }

    /**
     * Flush semua permission cache (jarang digunakan)
     */
    public function flushAllPermissionCache(): void
    {
        Cache::flush(); // Atau gunakan tags jika lebih preference
    }
}
