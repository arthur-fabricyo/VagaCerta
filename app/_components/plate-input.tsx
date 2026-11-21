"use client";

import { useState, type ComponentProps } from "react";
import { formatPlateInput } from "@/lib/input-format";

type PlateInputProps = Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export function PlateInput({ value, defaultValue = "", onValueChange, ...props }: PlateInputProps) {
  const [internalValue, setInternalValue] = useState(() => formatPlateInput(defaultValue));
  return <input {...props} autoComplete="off" autoCapitalize="characters" maxLength={8}
    placeholder="ABC-1234 ou ABC-1D23" value={value ?? internalValue}
    onChange={(event) => {
      const formatted = formatPlateInput(event.target.value);
      if (value === undefined) setInternalValue(formatted);
      onValueChange?.(formatted);
    }} />;
}
