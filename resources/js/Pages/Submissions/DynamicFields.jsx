import React from "react";
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

export default function DynamicFields({
    activeFields = [],
    data,
    setData,
    errors = {},
    setIsSaved,
}) {
    // 🔑 Ambil nilai jenis pembayaran berdasarkan NAMA FIELD
    const jenisPembayaran = data?.data?.["Jenis Pembayaran"] ?? "";
    const isKartuKredit = jenisPembayaran === "Rincian Kartu Kredit";

    const handleSetValue = (name, value) => {
        setData("data", {
            ...(data.data || {}),
            [name]: value,
        });
        setIsSaved(false);
    };

    return (
        <div className="border-t pt-6 mt-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Informasi Tambahan</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeFields.map((f) => {
                    const type = String(f.type || "text").toLowerCase();
                    const name = f.name;
                    const label = f.label;
                    const value = data?.data?.[name] ?? "";
                    const options = Array.isArray(f.options) ? f.options : [];

                    // 🚫 Sembunyikan Nama Bank jika bukan kartu kredit
                    if (name === "Nama Bank" && !isKartuKredit) {
                        return null;
                    }

                    // 🔖 Field label / separator
                    if (type === "label") {
                        return (
                            <div key={f.id || name} className="col-span-full">
                                <div className="border-t border-gray-300 my-4" />
                                <h4 className="font-bold text-lg py-2">
                                    {label}
                                </h4>
                            </div>
                        );
                    }

                    return (
                        <div key={f.id || name}>
                            <Label>
                                {label}
                                {f.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                )}
                            </Label>

                            {/* TEXTAREA */}
                            {type === "textarea" && (
                                <Textarea
                                    rows={3}
                                    value={value}
                                    onChange={(e) =>
                                        handleSetValue(name, e.target.value)
                                    }
                                    className="mt-1"
                                />
                            )}

                            {/* DATE */}
                            {type === "date" && (
                                <Input
                                    type="date"
                                    value={value}
                                    onChange={(e) =>
                                        handleSetValue(name, e.target.value)
                                    }
                                    className="mt-1"
                                />
                            )}

                            {/* NUMBER */}
                            {type === "number" && (
                                <Input
                                    type="number"
                                    value={value}
                                    onChange={(e) =>
                                        handleSetValue(name, e.target.value)
                                    }
                                    className="mt-1"
                                />
                            )}

                            {/* FILE */}
                            {type === "file" && (
                                <Input
                                    type="file"
                                    onChange={(e) =>
                                        handleSetValue(
                                            name,
                                            e.target.files?.[0] || null
                                        )
                                    }
                                    className="mt-1"
                                />
                            )}

                            {/* SELECT */}
                            {type === "select" && (
                                <Select
                                    value={String(value)}
                                    onValueChange={(v) => {
                                        const nextData = {
                                            ...(data.data || {}),
                                            [name]: v,
                                        };

                                        // 🔁 Reset Nama Bank jika ganti dari kartu kredit
                                        if (
                                            name === "Jenis Pembayaran" &&
                                            v !== "Rincian Kartu Kredit"
                                        ) {
                                            nextData["Nama Bank"] = "";
                                        }

                                        setData("data", nextData);
                                        setIsSaved(false);
                                    }}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue
                                            placeholder={`Pilih ${label}`}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.map((opt, idx) => {
                                            const val =
                                                typeof opt === "object"
                                                    ? String(
                                                          opt.value ?? opt.id
                                                      )
                                                    : String(opt);

                                            const optLabel =
                                                typeof opt === "object"
                                                    ? opt.label ??
                                                      opt.name ??
                                                      val
                                                    : val;

                                            return (
                                                <SelectItem
                                                    key={val || idx}
                                                    value={val}
                                                >
                                                    {optLabel}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* DEFAULT TEXT */}
                            {type === "text" && (
                                <Input
                                    value={value}
                                    onChange={(e) =>
                                        handleSetValue(name, e.target.value)
                                    }
                                    className="mt-1"
                                />
                            )}

                            {/* ERROR */}
                            {f.required && errors[`data.${name}`] && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors[`data.${name}`]}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
