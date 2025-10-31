import React from "react";
import { Head, useForm } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";

export default function Edit({ document, subdivisions }) {
    const { data, setData, post, processing } = useForm({
        permissions: subdivisions.reduce((acc, subdivision) => {
            acc[subdivision.id] = {
                can_view:
                    subdivision.document_permissions[0]?.can_view || false,
                can_create:
                    subdivision.document_permissions[0]?.can_create || false,
                can_edit:
                    subdivision.document_permissions[0]?.can_edit || false,
                can_delete:
                    subdivision.document_permissions[0]?.can_delete || false,
                can_approve:
                    subdivision.document_permissions[0]?.can_approve || false,
                can_reject:
                    subdivision.document_permissions[0]?.can_reject || false,
            };
            return acc;
        }, {}),
    });

    const handleCheckbox = (subId, field) => {
        setData((prev) => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [subId]: {
                    ...prev.permissions[subId],
                    [field]: !prev.permissions[subId][field],
                },
            },
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("document.permissions.update", document.id));
    };

    return (
        <div className="p-6">
            <Head title={`Manage Permissions - ${document.name}`} />
            <Card className="p-6 shadow">
                <h2 className="text-xl font-semibold mb-4">
                    Permissions for {document.name}
                </h2>

                <form onSubmit={handleSubmit}>
                    <table className="w-full border">
                        <thead>
                            <tr className="bg-gray-100 text-left">
                                <th className="p-2 border">Subdivision</th>
                                <th className="p-2 border text-center">View</th>
                                <th className="p-2 border text-center">
                                    Create
                                </th>
                                <th className="p-2 border text-center">Edit</th>
                                <th className="p-2 border text-center">
                                    Delete
                                </th>
                                <th className="p-2 border text-center">
                                    Approve
                                </th>
                                <th className="p-2 border text-center">
                                    Reject
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {subdivisions.map((s) => (
                                <tr key={s.id}>
                                    <td className="p-2 border">{s.name}</td>
                                    {[
                                        "can_view",
                                        "can_create",
                                        "can_edit",
                                        "can_delete",
                                        "can_approve",
                                        "can_reject",
                                    ].map((field) => (
                                        <td
                                            key={field}
                                            className="p-2 border text-center"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    data.permissions[s.id][
                                                        field
                                                    ]
                                                }
                                                onChange={() =>
                                                    handleCheckbox(s.id, field)
                                                }
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-4 text-right">
                        <Button type="submit" disabled={processing}>
                            Save Permissions
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
