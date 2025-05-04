import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string | number;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string | number | undefined;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  labelClassName?: string;
}

export const Dropdown = ({
  options,
  value,
  onValueChange,
  label,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  error,
  className,
  labelClassName,
}: DropdownProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(labelClassName)}>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <Select
        value={value?.toString()}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={cn(error && "border-destructive")}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};
