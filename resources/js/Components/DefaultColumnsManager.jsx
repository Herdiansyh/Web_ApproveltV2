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
                key: key || `col_${defaultColumns.length + 1}`
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
        }, 0);
    };

    const saveEdit = () => {
        if (!editingValue.trim() || editingColumn === null) return;
        
        const newColumns = [...defaultColumns];
        const key = editingValue.toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");
        
        newColumns[editingColumn] = {
            ...newColumns[editingColumn],
            name: editingValue.trim(),
            key: key || newColumns[editingColumn].key
        };
        
        // Batch state updates to prevent multiple renders
        setEditingColumn(null);
        setEditingValue("");
        onChange(newColumns);
    };

    const cancelEdit = () => {
        setEditingColumn(null);
        setEditingValue("");
        // Clear focus
        editInputRef.current?.blur();
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
                                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border"
                            >
                                {editingColumn === index ? (
                                    <>
                                        <Input
                                            ref={editInputRef}
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && saveEdit()}
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={saveEdit}
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                            disabled={!editingValue.trim()}
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            onClick={cancelEdit}
                                            size="sm"
                                            variant="outline"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1">
                                            <div className="font-medium">{column.name}</div>
                                            <div className="text-sm text-gray-500">Key: {column.key}</div>
                                        </div>
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
                                    </>
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
