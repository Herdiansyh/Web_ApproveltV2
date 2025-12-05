import React, { useState } from "react";
import Calendar from "react-calendar";
import { Button } from "@/Components/ui/button";
import { Calendar as CalendarIcon, X } from "lucide-react";
import "react-calendar/dist/Calendar.css";
import "../../css/calendar-custom.css";

export default function DateFilter({
    onFilterChange,
    placeholder = "Pilih tanggal...",
    label = "Filter Tanggal",
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [filterMode, setFilterMode] = useState("single"); // 'single', 'range'
    const [tempStartDate, setTempStartDate] = useState(null);
    const [tempEndDate, setTempEndDate] = useState(null);

    const formatDate = (date) => {
        if (!date) return "";
        return date.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "2-digit",
        });
    };

    const handleSingleDateSelect = (date) => {
        setStartDate(date);
        setEndDate(null);
        setTempStartDate(date);
        setTempEndDate(null);
        onFilterChange({
            startDate: date,
            endDate: null,
            mode: "single",
        });
        setIsOpen(false);
    };

    const handleRangeDateSelect = (date) => {
        if (!tempStartDate) {
            setTempStartDate(date);
        } else if (!tempEndDate) {
            if (date < tempStartDate) {
                setTempStartDate(date);
                setTempEndDate(tempStartDate);
            } else {
                setTempEndDate(date);
            }
        } else {
            setTempStartDate(date);
            setTempEndDate(null);
        }
    };

    const handleRangeConfirm = () => {
        if (tempStartDate && tempEndDate) {
            setStartDate(tempStartDate);
            setEndDate(tempEndDate);
            onFilterChange({
                startDate: tempStartDate,
                endDate: tempEndDate,
                mode: "range",
            });
            setIsOpen(false);
        }
    };

    const handleClear = () => {
        setStartDate(null);
        setEndDate(null);
        setTempStartDate(null);
        setTempEndDate(null);
        setFilterMode("single");
        onFilterChange({
            startDate: null,
            endDate: null,
            mode: null,
        });
    };

    const tileClassName = ({ date }) => {
        if (filterMode === "single") {
            if (startDate && date.toDateString() === startDate.toDateString()) {
                return "selected-date";
            }
        } else if (filterMode === "range") {
            if (
                tempStartDate &&
                date.toDateString() === tempStartDate.toDateString()
            ) {
                return "selected-date";
            }
            if (
                tempEndDate &&
                date.toDateString() === tempEndDate.toDateString()
            ) {
                return "selected-date";
            }
            if (
                tempStartDate &&
                tempEndDate &&
                date > tempStartDate &&
                date < tempEndDate
            ) {
                return "in-range";
            }
        }
        return "";
    };

    const displayText =
        filterMode === "single"
            ? startDate
                ? `Tanggal: ${formatDate(startDate)}`
                : placeholder
            : startDate && endDate
            ? `${formatDate(startDate)} - ${formatDate(endDate)}`
            : placeholder;

    return (
        <div className="relative w-full md:w-80">
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    <div
                        className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground text-sm cursor-pointer hover:border-primary/60 transition flex items-center gap-2"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{displayText}</span>
                    </div>
                </div>

                {(startDate || endDate) && (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={handleClear}
                        className="rounded-lg hover:bg-muted/60"
                        title="Clear filter"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-card border border-border/50 rounded-lg shadow-lg p-4 min-w-max">
                    {/* Mode Selector */}
                    <div className="flex gap-2 mb-4">
                        <Button
                            type="button"
                            size="sm"
                            variant={
                                filterMode === "single" ? "default" : "outline"
                            }
                            onClick={() => {
                                setFilterMode("single");
                                setTempStartDate(null);
                                setTempEndDate(null);
                            }}
                            className="text-xs rounded-md"
                        >
                            Tanggal Tertentu
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={
                                filterMode === "range" ? "default" : "outline"
                            }
                            onClick={() => {
                                setFilterMode("range");
                                setTempStartDate(startDate);
                                setTempEndDate(endDate);
                            }}
                            className="text-xs rounded-md"
                        >
                            Rentang Tanggal
                        </Button>
                    </div>

                    {/* Calendar */}
                    <div className="mb-4 bg-background rounded-md overflow-hidden">
                        <Calendar
                            onChange={
                                filterMode === "single"
                                    ? handleSingleDateSelect
                                    : handleRangeDateSelect
                            }
                            value={
                                filterMode === "single"
                                    ? startDate
                                    : tempStartDate || null
                            }
                            tileClassName={tileClassName}
                            locale="id-ID"
                            className="react-calendar-custom"
                        />
                    </div>

                    {/* Range Actions */}
                    {filterMode === "range" && (
                        <div className="space-y-2 border-t border-border/30 pt-3">
                            <div className="text-xs text-muted-foreground">
                                {tempStartDate && (
                                    <p>
                                        Mulai:{" "}
                                        <span className="font-semibold text-foreground">
                                            {formatDate(tempStartDate)}
                                        </span>
                                    </p>
                                )}
                                {tempEndDate && (
                                    <p>
                                        Selesai:{" "}
                                        <span className="font-semibold text-foreground">
                                            {formatDate(tempEndDate)}
                                        </span>
                                    </p>
                                )}
                                {!tempStartDate && (
                                    <p className="text-amber-600">
                                        Pilih tanggal mulai...
                                    </p>
                                )}
                                {tempStartDate && !tempEndDate && (
                                    <p className="text-amber-600">
                                        Pilih tanggal selesai...
                                    </p>
                                )}
                            </div>
                            {tempStartDate && tempEndDate && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleRangeConfirm}
                                    className="w-full rounded-md"
                                >
                                    Terapkan Filter
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Close Button */}
                    <div className="mt-2 border-t border-border/30 pt-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            className="w-full rounded-md text-xs"
                        >
                            Tutup
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
