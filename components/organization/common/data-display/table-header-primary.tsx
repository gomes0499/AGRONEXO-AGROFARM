import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TableHeaderColumn {
  label: string;
  className?: string;
}

type TableHeaderItem = string | TableHeaderColumn;

interface TableHeaderPrimaryProps {
  headers: TableHeaderItem[];
  className?: string;
}

export function TableHeaderPrimary({
  headers,
  className = "",
}: TableHeaderPrimaryProps) {
  return (
    <TableHeader className={`bg-primary rounded-t-md ${className}`}>
      <TableRow className="border-b-0 hover:bg-primary">
        {headers.map((header, index) => {
          const isString = typeof header === "string";
          const label = isString ? header : header.label;
          const headerClassName = isString ? "" : header.className || "";
          
          return (
            <TableHead
              key={index}
              className={`text-white font-semibold ${
                index === 0 ? "first:rounded-tl-md" : ""
              } ${index === headers.length - 1 ? "last:rounded-tr-md" : ""} ${
                headerClassName
              }`}
            >
              {label}
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  );
}
