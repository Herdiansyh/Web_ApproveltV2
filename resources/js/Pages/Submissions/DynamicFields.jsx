import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Textarea } from "@/Components/ui/textarea";
import React from "react";

export default function DynamicFields({
    activeFields,
    data,
    setData,
    errors,
    setIsSaved,
}) {
    return (
        <div
            className="border-t pt-6 mt-6"
            style={{
                borderRadius: "10px",
            }}
        >
            <h3 className="text-lg font-semibold mb-4">Informasi Tambahan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeFields.map((f) => {
                    const type = String(f.type || "text").toLowerCase();
                    const value = data.data?.[f.name] ?? "";
                    const setVal = (v) => {
                        setData("data", {
                            ...(data.data || {}),
                            [f.name]: v,
                        });
                        setIsSaved(false);
                    };

                    const options = Array.isArray(f.options) ? f.options : [];

                    const renderSelectOptions = () => {
                        if (!options.length) return null;
                        return options.map((opt, idx) => {
                            if (opt && typeof opt === "object") {
                                const val = String(opt.value ?? opt.id ?? "");
                                const label =
                                    opt.label ?? String(opt.name ?? val);
                                return (
                                    <SelectItem key={val || idx} value={val}>
                                        {label}
                                    </SelectItem>
                                );
                            }
                            const val = String(opt);
                            return (
                                <SelectItem key={val} value={val}>
                                    {val}
                                </SelectItem>
                            );
                        });
                    };

                    return (
                        <div key={f.id || f.name}>
                            {type === "label" ? (
                                // For label type, only show the label as a separator without the field label
                                <div className="col-span-full mt-1">
                                    <div className="border-t border-gray-300 dark:border-gray-600 my-4"></div>
                                    <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200 py-2">
                                        {f.label}
                                    </h4>
                                </div>
                            ) : (
                                <>
                                    <Label>
                                        {f.label}
                                        {f.required && (
                                            <span className="text-red-500 ml-1">*</span>
                                        )}
                                    </Label>
                                    {type === "textarea" ? (
                                <Textarea
                                    style={{
                                        borderRadius: "10px",
                                    }}
                                    value={value}
                                    onChange={(e) => setVal(e.target.value)}
                                    rows={3}
                                    className={`mt-1 ${
                                        f.required &&
                                        (!value || value.trim() === "") &&
                                        errors[`data.${f.name}`]
                                            ? "border-red-500"
                                            : ""
                                    }`}
                                />
                            ) : type === "date" ? (
                                <Input
                                    style={{
                                        borderRadius: "10px",
                                    }}
                                    type="date"
                                    value={value}
                                    onChange={(e) => setVal(e.target.value)}
                                    className={`mt-1 ${
                                        f.required &&
                                        !value &&
                                        errors[`data.${f.name}`]
                                            ? "border-red-500"
                                            : ""
                                    }`}
                                />
                            ) : type === "select" ? (
                                <Select
                                    value={value === null ? "" : String(value)}
                                    onValueChange={(v) => setVal(v)}
                                >
                                    <SelectTrigger
                                        style={{
                                            borderRadius: "10px",
                                        }}
                                        className={`w-full mt-1 ${
                                            f.required &&
                                            (!value || value === "") &&
                                            errors[`data.${f.name}`]
                                                ? "border-red-500"
                                                : ""
                                        }`}
                                    >
                                        <SelectValue
                                            placeholder={`Pilih ${f.label}`}
                                        />
                                    </SelectTrigger>
                                    <SelectContent
                                        style={{
                                            borderRadius: "10px",
                                        }}
                                    >
                                        {renderSelectOptions()}
                                    </SelectContent>
                                </Select>
                            ) : type === "number" ? (
                                <Input
                                    style={{
                                        borderRadius: "10px",
                                    }}
                                    type="number"
                                    value={value}
                                    onChange={(e) => setVal(e.target.value)}
                                    className={`mt-1 ${
                                        f.required &&
                                        (!value || value.trim() === "") &&
                                        errors[`data.${f.name}`]
                                            ? "border-red-500"
                                            : ""
                                    }`}
                                />
                            ) : type === "file" ? (
                                <Input
                                    style={{
                                        borderRadius: "10px",
                                    }}
                                    type="file"
                                    onChange={(e) => {
                                        const file =
                                            e.target.files && e.target.files[0];
                                        setVal(file ? file.name : "");
                                    }}
                                    className={`mt-1 ${
                                        f.required &&
                                        (!value || value.trim() === "") &&
                                        errors[`data.${f.name}`]
                                            ? "border-red-500"
                                            : ""
                                    }`}
                                />
                            ) : (
                                <Input
                                    style={{
                                        borderRadius: "10px",
                                    }}
                                    value={value}
                                    onChange={(e) => setVal(e.target.value)}
                                    className={`mt-1 ${
                                        f.required &&
                                        (!value || value.trim() === "") &&
                                        errors[`data.${f.name}`]
                                            ? "border-red-500"
                                            : ""
                                    }`}
                                />
                            )}
                            {f.required && errors[`data.${f.name}`] && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors[`data.${f.name}`]}
                                </p>
                            )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
