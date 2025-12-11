<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_active',
        'default_columns',
    ];

    protected $casts = [
        'default_columns' => 'array',
    ];

    /**
     * Get default columns with proper structure for new format
     * Ensures backward compatibility with old format {name, key}
     */
    public function getDefaultColumnsWithTypesAttribute(): array
    {
        $columns = $this->default_columns ?? [];
        
        return array_map(function ($column) {
            // Backward compatibility: if old format, add default values
            if (!isset($column['type'])) {
                return [
                    'name' => $column['name'] ?? '',
                    'key' => $column['key'] ?? '',
                    'type' => 'text',
                    'required' => false,
                    'options' => []
                ];
            }
            
            // Ensure options is array
            if (isset($column['options_json'])) {
                $column['options'] = json_decode($column['options_json'], true) ?? [];
                unset($column['options_json']);
            } elseif (!isset($column['options'])) {
                $column['options'] = [];
            }
            
            return $column;
        }, $columns);
    }

    /**
     * Set default columns with validation
     */
    public function setDefaultColumnsWithTypesAttribute(array $columns): void
    {
        $validatedColumns = array_map(function ($column) {
            return [
                'name' => $column['name'] ?? '',
                'key' => $column['key'] ?? '',
                'type' => in_array($column['type'] ?? 'text', ['text', 'number', 'date', 'select']) 
                    ? $column['type'] 
                    : 'text',
                'required' => (bool) ($column['required'] ?? false),
                'options' => is_array($column['options'] ?? []) ? $column['options'] : []
            ];
        }, $columns);
        
        $this->attributes['default_columns'] = json_encode($validatedColumns);
    }

    /**
     * Get default columns for table display
     */
    public function getTableColumnsAttribute(): array
    {
        return collect($this->default_columns_with_types)
            ->map(function ($column) {
                return [
                    'name' => $column['name'],
                    'key' => $column['key'],
                    'type' => $column['type'],
                    'required' => $column['required'],
                    'options' => $column['options']
                ];
            })
            ->toArray();
    }

    public function fields(): HasMany
    {
        return $this->hasMany(DocumentField::class)->orderBy('order');
    }

    public function nameSeries(): HasOne
    {
        return $this->hasOne(DocumentNameSeries::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }
}

