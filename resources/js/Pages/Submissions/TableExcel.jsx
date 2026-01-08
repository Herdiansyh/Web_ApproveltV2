import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

export default function TableExcel({
    data,
    setData,
    setIsSaved,
    newColumnName,
    setNewColumnName,
    addColumn,
    editingColumn,
    setEditingColumn,
    updateColumnName,
    deleteColumn,
    addRow,
    deleteRow,
    updateCellData,
    selectedWorkflow,
    existingTableData = [],
}) {
    const [editValue, setEditValue] = React.useState("");

    return (
        <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                    Data Tambahan{" "}
                    {selectedWorkflow?.document?.enable_data_tables
                        ? ""
                        : "(Opsional)"}
                </h3>
                <div className="flex items-center gap-2">
                    <input
                        type="hidden"
                        name="useTableData"
                        value={data.useTableData ? "true" : "false"}
                    />

                    <input
                        type="checkbox"
                        id="useTableData"
                        disabled={
                            selectedWorkflow?.document?.enable_data_tables
                        }
                        checked={data.useTableData}
                        onChange={(e) => {
                            setData("useTableData", e.target.checked);
                            setIsSaved(false);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    <Label
                        htmlFor="useTableData"
                        className="text-sm font-medium text-gray-700"
                    >
                        Gunakan Data Table
                    </Label>
                </div>
            </div>

            <p
                style={{ borderRadius: "10px" }}
                className={`text-sm ${
                    selectedWorkflow?.document?.enable_data_tables
                        ? "text-white text-center bg-red-600 max-w-md p-1"
                        : "text-gray-600"
                } mb-4  `}
            >
                {selectedWorkflow?.document?.enable_data_tables
                    ? "Wajib mengisi data table di pengajuan dokumen ini !"
                    : "Centang 'Gunakan Data Table' jika ingin menyertakan data tabel dalam pengajuan ini. (Opsional)"}
            </p>

            {data.useTableData && (
                <>
                    {/* Column Management */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 w-full">
                            <Input
                                placeholder="Nama kolom baru..."
                                value={newColumnName}
                                onChange={(e) =>
                                    setNewColumnName(e.target.value)
                                }
                                className="sm:w-[200px] w-full"
                                style={{
                                    borderRadius: "8px",
                                }}
                            />

                            <Button
                                type="button"
                                onClick={addColumn}
                                style={{
                                    borderRadius: "8px",
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 w-full sm:w-auto"
                            >
                                + Tambah Kolom
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {data.tableColumns.map((column) => (
                                <div
                                    key={column.id}
                                    className="flex items-center gap-1 bg-white px-2 py-1 rounded border"
                                >
                                    {editingColumn === column.id ? (
                                        <Input
                                            value={editValue}
                                            onChange={(e) =>
                                                setEditValue(e.target.value)
                                            }
                                            onBlur={() => {
                                                updateColumnName(
                                                    column.id,
                                                    editValue
                                                );
                                                setEditingColumn(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    updateColumnName(
                                                        column.id,
                                                        editValue
                                                    );
                                                    setEditingColumn(null);
                                                }
                                            }}
                                            style={{
                                                borderRadius: "4px",
                                                width: "120px",
                                                height: "24px",
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        <div
                                            className="flex items-center gap-1 cursor-pointer hover:text-blue-600 text-sm"
                                            onClick={() => {
                                                setEditingColumn(column.id);
                                                setEditValue(column.name); // isi nilai awal saat mulai edit
                                            }}
                                        >
                                            <span>{column.name}</span>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <span>({column.type})</span>
                                                {column.required && (
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {data.tableColumns.length > 1 && (
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                deleteColumn(column.id)
                                            }
                                            style={{
                                                borderRadius: "4px",
                                            }}
                                            className="bg-red-500 hover:bg-red-600 text-white p-1 h-6 w-6"
                                        >
                                            ×
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-100">
                                <tr>
                                    {data.tableColumns.map((column) => (
                                        <th
                                            key={column.id}
                                            className="border p-2 text-left min-w-[120px]"
                                        >
                                            <div className="flex items-center gap-1">
                                                {column.name}
                                                {column.required && (
                                                    <span className="text-red-500 text-xs">
                                                        *
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="border p-2 text-center w-20">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.tableData.map((row, rowIndex) => (
                                    <tr key={row.id}>
                                        {data.tableColumns.map((column) => (
                                            <td
                                                key={column.id}
                                                className="border p-2"
                                            >
                                                {column.type === "select" ? (
                                                    <Select
                                                        value={
                                                            row[column.key] ||
                                                            ""
                                                        }
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            updateCellData(
                                                                row.id,
                                                                column.key,
                                                                value
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue
                                                                placeholder={`Pilih ${column.name.toLowerCase()}...`}
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {column.options?.map(
                                                                (
                                                                    option,
                                                                    index
                                                                ) => (
                                                                    <SelectItem
                                                                        key={`${column.key}-option-${index}-${option}`}
                                                                        value={
                                                                            option
                                                                        }
                                                                    >
                                                                        {option}
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        value={
                                                            row[column.key] ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateCellData(
                                                                row.id,
                                                                column.key,
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder={`Isi ${column.name.toLowerCase()}...`}
                                                        style={{
                                                            borderRadius: "8px",
                                                        }}
                                                        type={
                                                            column.type ===
                                                            "number"
                                                                ? "number"
                                                                : column.type ===
                                                                  "date"
                                                                ? "date"
                                                                : "text"
                                                        }
                                                        required={
                                                            column.required
                                                        }
                                                    />
                                                )}
                                            </td>
                                        ))}
                                        <td className="border p-2 text-center">
                                            {data.tableData.length > 1 && (
                                                <Button
                                                    onClick={() =>
                                                        deleteRow(row.id)
                                                    }
                                                    style={{
                                                        borderRadius: "8px",
                                                    }}
                                                    className="bg-red-500 hover:bg-red-600 text-white p-2 h-8 w-8"
                                                >
                                                    ×
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Row Management */}
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            Total {data.tableData.length} baris
                        </div>
                        <Button
                            type="button"
                            onClick={addRow}
                            style={{
                                borderRadius: "8px",
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                        >
                            + Tambah Baris
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
