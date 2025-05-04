import * as React from "react";
import { X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export interface TableColumn {
  header: string;
  accessor: string;
  className?: string;
}

interface PreviewTableProps<T extends { id?: string | number }> {
  columns: TableColumn[];
  data: T[];
  onRemove?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function PreviewTable<T extends { id?: string | number }>({
  columns,
  data,
  onRemove,
  emptyMessage = "No data to display",
  className,
}: PreviewTableProps<T>) {
  // Handle unique keys for rows
  const getRowKey = (row: T, index: number) => {
    return row.id ? row.id.toString() : `row-${index}`;
  };

  // Generate cell value based on accessor
  const getCellValue = (row: T, accessor: string) => {
    const keys = accessor.split(".");
    let value: any = row;
    
    for (const key of keys) {
      if (value === null || value === undefined) return "";
      value = value[key as keyof typeof value];
    }
    
    return value;
  };

  return (
    <div className={className}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={`header-${index}`} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
              {onRemove && <TableHead className="w-16">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onRemove ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow key={getRowKey(row, rowIndex)}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={`cell-${rowIndex}-${colIndex}`} className={column.className}>
                      {getCellValue(row, column.accessor)}
                    </TableCell>
                  ))}
                  {onRemove && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(row)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
