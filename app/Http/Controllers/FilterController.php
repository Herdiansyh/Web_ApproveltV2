<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentNameSeries;
use Illuminate\Http\Request;

class FilterController extends Controller
{
    /**
     * Get filter options based on filter type
     */
    public function getOptions(Request $request)
    {
        $filterType = $request->get('filter_type');
        
        switch ($filterType) {
            case 'doctype':
                return response()->json([
                    'options' => Document::where('is_active', true)
                        ->orderBy('name')
                        ->get(['id', 'name'])
                        ->map(function ($doc) {
                            return [
                                'value' => $doc->id,
                                'label' => $doc->name,
                            ];
                        })
                ]);
                
            case 'prefix':
                return response()->json([
                    'options' => DocumentNameSeries::whereNotNull('prefix')
                        ->whereHas('document', function ($q) {
                            $q->where('is_active', true);
                        })
                        ->with('document:id,name')
                        ->get()
                        ->map(function ($series) {
                            return [
                                'value' => $series->prefix,
                                'label' => $series->prefix . ' - ' . $series->document->name,
                            ];
                        })
                        ->sortBy('value')
                        ->values()
                ]);
                
            case 'division':
                return response()->json([
                    'options' => \App\Models\Division::orderBy('name')
                        ->get(['id', 'name'])
                        ->map(function ($division) {
                            return [
                                'value' => $division->id,
                                'label' => $division->name,
                            ];
                        })
                ]);
                
            case 'status':
                return response()->json([
                    'options' => [
                        ['value' => 'approved', 'label' => 'Approved'],
                        ['value' => 'rejected', 'label' => 'Rejected'],
                        ['value' => 'cancelled', 'label' => 'Cancelled'],
                    ]
                ]);
                
            default:
                return response()->json(['options' => []]);
        }
    }
}
