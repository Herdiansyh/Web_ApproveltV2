<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DocumentNameSeriesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $documentId = $this->route('document')?->id;
        
        return [
            'series_pattern' => 'nullable|string|max:255',
            'prefix' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('document_name_series', 'prefix')->ignore($documentId, 'document_id')
            ],
            'reset_type' => 'required|in:none,monthly,yearly',
            'current_number' => 'nullable|integer|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'prefix.unique' => 'Prefix sudah digunakan oleh dokumen lain. Silakan pilih prefix yang berbeda.',
            'series_pattern.required' => 'Pattern series wajib diisi.',
            'reset_type.required' => 'Tipe reset wajib dipilih.',
            'reset_type.in' => 'Tipe reset harus berupa: none, monthly, atau yearly.',
            'current_number.min' => 'Nomor current tidak boleh kurang dari 0.',
        ];
    }
}
