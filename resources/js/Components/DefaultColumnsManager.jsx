import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Card } from "@/Components/ui/card";
import { Trash2, Plus, Edit2, Check, X } from "lucide-react";

export default function DefaultColumnsManager({ 
    defaultColumns = [], 
    onChange, 
    maxColumns = 10 
}) {
    const [newColumnName, setNewColumnName] = useState("");
    const [editingColumn, setEditingColumn] = useState(null);
    const [editingValue, setEditingValue] = useState("");
    const [editingColumnData, setEditingColumnData] = useState({});
    const editInputRef = useRef(null);

    // Focus input when entering edit mode
    useEffect(() => {
        if (editingColumn !== null && editInputRef.current) {
            // Small delay to ensure the input is rendered
            setTimeout(() => {
                editInputRef.current?.focus();
                editInputRef.current?.select();
            }, 50);
        }
    }, [editingColumn]);

    const addColumn = () => {
        if (newColumnName.trim() && defaultColumns.length < maxColumns) {
            const key = newColumnName.toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^a-z0-9_]/g, "");
            
            const newColumn = {
                name: newColumnName.trim(),
                key: key || `col_${defaultColumns.length + 1}`,
                type: 'text',
                required: false,
                options: []
            };
            
            onChange([...defaultColumns, newColumn]);
            setNewColumnName("");
        }
    };

    const deleteColumn = (index) => {
        const newColumns = defaultColumns.filter((_, i) => i !== index);
        onChange(newColumns);
    };

    const startEditing = (index, column) => {
        // Prevent multiple clicks and ensure clean state
        if (editingColumn !== null) return;
        
        // Use setTimeout to ensure this doesn't trigger immediately
        setTimeout(() => {
            setEditingColumn(index);
            setEditingValue(column.name);
            setEditingColumnData({
                type: column.type || 'text',
                required: column.required || false,
                options: (column.options || []).join(', ')
            });
        }, 0);
    };

    const saveEdit = () => {
        if (!editingValue.trim() || editingColumn === null) return;
        
        const newColumns = [...defaultColumns];
        const key = editingValue.toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");
        
        // Parse options for select type
        let options = [];
        if (editingColumnData.type === 'select' && editingColumnData.options.trim()) {
            options = editingColumnData.options
                .split(/[\n,]+/)
                .map(opt => opt.trim())
                .filter(opt => opt.length > 0);
        }
        
        newColumns[editingColumn] = {
            ...newColumns[editingColumn],
            name: editingValue.trim(),
            key: key || newColumns[editingColumn].key,
            type: editingColumnData.type,
            required: editingColumnData.required,
            options: options
        };
        
        // Batch state updates to prevent multiple renders
        setEditingColumn(null);
        setEditingValue("");
        setEditingColumnData({});
        onChange(newColumns);
    };

    const cancelEdit = () => {
        setEditingColumn(null);
        setEditingValue("");
        setEditingColumnData({});
        // Clear focus
        editInputRef.current?.blur();
    };

    const updateEditingColumnData = (field, value) => {
        setEditingColumnData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Card className="p-4">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Kolom Default Tabel</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Atur kolom default yang akan muncul saat user mengaktifkan data table. 
                        User tetap bisa menambah atau mengubah kolom sesuai kebutuhan.
                    </p>
                </div>

                {/* Add New Column */}
                <div className="flex gap-2">
                    <Input
                        placeholder="Nama kolom baru..."
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addColumn()}
                        className="flex-1"
                    />
                    <Button
                        onClick={addColumn}
                        disabled={!newColumnName.trim() || defaultColumns.length >= maxColumns}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah
                    </Button>
                </div>

                {/* Columns List */}
                <div className="space-y-2">
                    {defaultColumns.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                            <p>Belum ada kolom default</p>
                            <p className="text-sm">Tambahkan kolom untuk dijadikan default</p>
                        </div>
                    ) : (
                        defaultColumns.map((column, index) => (
                            <div
                                key={index}
                                className="border rounded-lg p-3 bg-gray-50"
                            >
                                {editingColumn === index ? (
                                    <div className="space-y-3">
                                        {/* Name Input */}
                                        <div>
                                            <label className="text-sm font-medium">Nama Kolom</label>
                                            <Input
                                                ref={editInputRef}
                                                value={editingValue}
                                                onChange={(e) => setEditingValue(e.target.value)}
                                                onKeyPress={(e) => e.key === "Enter" && saveEdit()}
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Type Select */}
                                        <div>
                                            <label className="text-sm font-medium">Tipe Data</label>
                                            <select
                                                value={editingColumnData.type}
                                                onChange={(e) => updateEditingColumnData('type', e.target.value)}
                                                className="w-full mt-1 border p-2 rounded"
                                            >
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="date">Date</option>
                                                <option value="select">Select (Dropdown)</option>
                                            </select>
                                        </div>

                                        {/* Required Checkbox */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`required-${index}`}
                                                checked={editingColumnData.required}
                                                onChange={(e) => updateEditingColumnData('required', e.target.checked)}
                                            />
                                            <label htmlFor={`required-${index}`} className="text-sm">
                                                Wajib diisi (Required)
                                            </label>
                                        </div>

                                        {/* Options for Select Type */}
                                        {editingColumnData.type === 'select' && (
                                            <div>
                                                <label className="text-sm font-medium">
                                                    Opsi (pisahkan dengan koma atau enter)
                                                </label>
                                                <textarea
                                                    value={editingColumnData.options}
                                                    onChange={(e) => updateEditingColumnData('options', e.target.value)}
                                                    className="w-full mt-1 border p-2 rounded"
                                                    rows={3}
                                                    placeholder="Opsi 1, Opsi 2, Opsi 3"
                                                />
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                onClick={saveEdit}
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                disabled={!editingValue.trim()}
                                            >
                                                <Check className="w-4 h-4 mr-1" />
                                                Simpan
                                            </Button>
                                            <Button
                                                onClick={cancelEdit}
                                                size="sm"
                                                variant="outline"
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                Batal
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium">{column.name}</div>
                                            <div className="text-sm text-gray-500">
                                                Key: {column.key} • Type: {column.type || 'text'}
                                                {column.required ? ' • Required' : ''}
                                            </div>
                                            {Array.isArray(column.options) && column.options.length > 0 && (
                                                <div className="text-xs text-gray-600 mt-1">
                                                    Options: {column.options.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    startEditing(index, column);
                                                }}
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                onClick={() => deleteColumn(index)}
                                                size="sm"
                                                variant="destructive"
                                                disabled={defaultColumns.length <= 1}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {defaultColumns.length >= maxColumns && (
                    <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        Maksimal {maxColumns} kolom default
                    </div>
                )}
            </div>
        </Card>
    );
}
