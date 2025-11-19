import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import React from "react";

export default function FieldsModal({
    fieldDoc,
    closeFields,
    startEditField,
    deleteField,
    fieldForm,
    setFieldForm,
    saveField,
    startCreateField,
}) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <Card
                className="w-full max-w-3xl p-4"
                style={{ borderRadius: "15px" }}
            >
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">
                        Manage Fields — {fieldDoc?.name}
                    </h3>
                    <Button
                        style={{ borderRadius: "15px" }}
                        variant="outline"
                        size="sm"
                        onClick={closeFields}
                    >
                        Close
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-medium mb-2">Existing Fields</h4>
                        <div className=" space-y-2 max-h-80 overflow-auto pr-2">
                            {(fieldDoc?.fields || [])
                                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                .map((f) => (
                                    <div
                                        key={f.id}
                                        style={{ borderRadius: "15px" }}
                                        className="border  p-2 flex items-start justify-between gap-2"
                                    >
                                        <div>
                                            <div className="font-medium">
                                                {f.label}{" "}
                                                <span className="text-xs text-muted-foreground">
                                                    ({f.name})
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {f.type}
                                                {f.required
                                                    ? " • required"
                                                    : ""}{" "}
                                                • order {f.order ?? 0}
                                            </div>
                                            {Array.isArray(f.options) &&
                                                f.options.length > 0 && (
                                                    <div className="text-xs mt-1">
                                                        Options:{" "}
                                                        {f.options.join(", ")}
                                                    </div>
                                                )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                style={{
                                                    borderRadius: "15px",
                                                }}
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    startEditField(f)
                                                }
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                style={{
                                                    borderRadius: "15px",
                                                }}
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => deleteField(f)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            {(fieldDoc?.fields || []).length === 0 && (
                                <div className="text-sm text-muted-foreground">
                                    No fields yet.
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">
                            {fieldForm.id ? "Edit Field" : "Add Field"}
                        </h4>
                        <div className="space-y-2">
                            {!fieldForm.id && (
                                <div>
                                    <label className="text-sm">Name</label>
                                    <Input
                                        style={{ borderRadius: "15px" }}
                                        value={fieldForm.name}
                                        onChange={(e) =>
                                            setFieldForm({
                                                ...fieldForm,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. tanggal_mulai"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="text-sm">Label</label>
                                <Input
                                    style={{ borderRadius: "15px" }}
                                    value={fieldForm.label}
                                    onChange={(e) =>
                                        setFieldForm({
                                            ...fieldForm,
                                            label: e.target.value,
                                        })
                                    }
                                    placeholder="Tanggal Mulai"
                                />
                            </div>
                            <div>
                                <label className="text-sm">Type</label>
                                <select
                                    style={{ borderRadius: "15px" }}
                                    className="w-full border p-2"
                                    value={fieldForm.type}
                                    onChange={(e) =>
                                        setFieldForm({
                                            ...fieldForm,
                                            type: e.target.value,
                                        })
                                    }
                                >
                                    <option value="text">text</option>
                                    <option value="textarea">textarea</option>
                                    <option value="number">number</option>
                                    <option value="date">date</option>
                                    <option value="select">select</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm">Order</label>
                                <Input
                                    style={{ borderRadius: "15px" }}
                                    type="number"
                                    value={fieldForm.order}
                                    onChange={(e) =>
                                        setFieldForm({
                                            ...fieldForm,
                                            order: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    id="req"
                                    type="checkbox"
                                    checked={!!fieldForm.required}
                                    onChange={(e) =>
                                        setFieldForm({
                                            ...fieldForm,
                                            required: e.target.checked,
                                        })
                                    }
                                />
                                <label htmlFor="req" className="text-sm">
                                    Required
                                </label>
                            </div>
                            {fieldForm.type === "select" && (
                                <div>
                                    <label className="text-sm">
                                        Options (comma or newline separated)
                                    </label>
                                    <Textarea
                                        rows={4}
                                        value={fieldForm.optionsText}
                                        onChange={(e) =>
                                            setFieldForm({
                                                ...fieldForm,
                                                optionsText: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    style={{ borderRadius: "15px" }}
                                    onClick={saveField}
                                >
                                    {fieldForm.id
                                        ? "Update Field"
                                        : "Create Field"}
                                </Button>
                                {!fieldForm.id && (
                                    <Button
                                        style={{ borderRadius: "15px" }}
                                        type="button"
                                        variant="outline"
                                        onClick={startCreateField}
                                    >
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
