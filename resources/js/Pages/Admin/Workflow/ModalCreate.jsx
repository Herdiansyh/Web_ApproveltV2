import React, { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Plus } from "lucide-react";

export default function ModalCreate({
    data,
    setData,
    processing,
    handleSubmit,
    documents,
    divisions,
    subdivisions,
    availableActions,
    addStep,
    removeStep,
    updateStepName,
    updateStepDivision,
    editingWorkflow,
    reset,
    errors,
    setShowModal,
    setEditingWorkflow,
}) {
    const [selectedDivision, setSelectedDivision] = useState("");
    const [availableSubdivisions, setAvailableSubdivisions] = useState([]);

    // Update available subdivisions when division changes
    useEffect(() => {
        if (selectedDivision) {
            const filteredSubdivisions = subdivisions.filter(
                sub => sub.division_id.toString() === selectedDivision
            );
            setAvailableSubdivisions(filteredSubdivisions);
        } else {
            setAvailableSubdivisions([]);
        }
    }, [selectedDivision, subdivisions]);

    // Initialize selected division when editing
    useEffect(() => {
        if (editingWorkflow && data.division_ids && data.division_ids.length > 0) {
            setSelectedDivision(data.division_ids[0]);
        }
    }, [editingWorkflow, data.division_ids]);

    const handleDivisionChange = (divisionId) => {
        setSelectedDivision(divisionId);
        setData("division_ids", divisionId ? [divisionId] : []);
        // Clear subdivisions when division changes
        setData("subdivision_ids", []);
    };

    const handleSubdivisionToggle = (subdivisionId) => {
        const currentIds = data.subdivision_ids || [];
        const newIds = currentIds.includes(subdivisionId.toString())
            ? currentIds.filter(id => id !== subdivisionId.toString())
            : [...currentIds, subdivisionId.toString()];
        
        setData("subdivision_ids", newIds);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <h3 className="text-lg font-semibold mb-4">
                    {editingWorkflow ? "Edit Workflow" : "Create New Workflow"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Workflow Name & Document */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Workflow Name *</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className={errors.name ? "border-red-500" : ""}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="document_id">Document Type *</Label>
                            <Select
                                value={data.document_id?.toString()}
                                onValueChange={(val) =>
                                    setData("document_id", val)
                                }
                            >
                                <SelectTrigger
                                    className={
                                        errors.document_id
                                            ? "border-red-500"
                                            : ""
                                    }
                                >
                                    <SelectValue placeholder="Select Document" />
                                </SelectTrigger>
                                <SelectContent>
                                    {documents.map((doc) => (
                                        <SelectItem
                                            key={doc.id}
                                            value={doc.id.toString()}
                                        >
                                            {doc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.document_id && (
                                <p className="text-red-500 text-sm">
                                    {errors.document_id}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            className="w-full border rounded p-2"
                            rows={3}
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                        <input
                            id="wf_is_active"
                            type="checkbox"
                            checked={!!data.is_active}
                            onChange={(e) =>
                                setData("is_active", e.target.checked)
                            }
                        />
                        <Label htmlFor="wf_is_active">Active</Label>
                    </div>

                    {/* Divisions and Subdivisions Assignment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Division (Optional)</Label>
                            <Select
                                value={selectedDivision}
                                onValueChange={handleDivisionChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a division" />
                                </SelectTrigger>
                                <SelectContent>
                                    {divisions.map((d) => (
                                        <SelectItem key={d.id} value={d.id.toString()}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">Select division that can use this workflow</p>
                        </div>
                        <div>
                            <Label>Subdivisions (Optional)</Label>
                            <div className="border rounded p-2 max-h-32 overflow-y-auto">
                                {availableSubdivisions.length > 0 ? (
                                    availableSubdivisions.map((s) => (
                                        <div key={s.id} className="flex items-center gap-2 mb-1">
                                            <input
                                                type="checkbox"
                                                id={`sub_${s.id}`}
                                                checked={data.subdivision_ids?.includes(s.id.toString()) || false}
                                                onChange={() => handleSubdivisionToggle(s.id)}
                                            />
                                            <Label htmlFor={`sub_${s.id}`} className="text-sm">{s.name}</Label>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        {selectedDivision ? "No subdivisions available for this division" : "Select a division first"}
                                    </p>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Select subdivisions that can use this workflow</p>
                        </div>
                    </div>

                    {/* Steps */}
                    <div>
                        <Label>Steps *</Label>
                        {data.steps.map((step, index) => (
                            <div
                                key={index}
                                className="flex flex-col gap-2 mb-2 border p-2 rounded"
                            >
                                <div className="flex  gap-2 flex-col sm:flex-row">
                                    <Select
                                        value={step.division_id}
                                        onValueChange={(val) =>
                                            updateStepDivision(index, val)
                                        }
                                    >
                                        <SelectTrigger className="w-full ">
                                            <SelectValue placeholder="Select Division" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {divisions.map((d) => (
                                                <SelectItem
                                                    key={d.id}
                                                    value={d.id.toString()}
                                                >
                                                    {d.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Input
                                        placeholder="Step Name"
                                        value={step.step_name}
                                        onChange={(e) =>
                                            updateStepName(
                                                index,
                                                e.target.value
                                            )
                                        }
                                        className="text-sm"
                                    />

                                    {data.steps.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeStep(index)}
                                            style={{
                                                borderRadius: "15px",
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </div>

                                {/* Actions checkboxes */}
                                <div className="flex items-center gap-4 mt-1 flex-wrap">
                                    {availableActions.map((action) => (
                                        <label
                                            key={action}
                                            className="flex items-center gap-1"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    step.actions?.includes(
                                                        action
                                                    ) || false
                                                }
                                                onChange={(e) => {
                                                    const updatedSteps = [
                                                        ...data.steps,
                                                    ];
                                                    if (e.target.checked) {
                                                        updatedSteps[
                                                            index
                                                        ].actions = [
                                                            ...(step.actions ||
                                                                []),
                                                            action,
                                                        ];
                                                    } else {
                                                        updatedSteps[
                                                            index
                                                        ].actions = (
                                                            step.actions || []
                                                        ).filter(
                                                            (a) => a !== action
                                                        );
                                                    }
                                                    setData(
                                                        "steps",
                                                        updatedSteps
                                                    );
                                                }}
                                            />
                                            <span className="text-sm">
                                                {action}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addStep}
                            style={{ borderRadius: "15px" }}
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add Step
                        </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowModal(false);
                                setEditingWorkflow(null);
                                reset();
                            }}
                            disabled={processing}
                            style={{ borderRadius: "15px" }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            style={{ borderRadius: "15px" }}
                        >
                            {processing
                                ? "Processing..."
                                : editingWorkflow
                                ? "Update Workflow"
                                : "Create Workflow"}
                        </Button>
                    </div>
                </form>
            </Card>{" "}
        </div>
    );
}
