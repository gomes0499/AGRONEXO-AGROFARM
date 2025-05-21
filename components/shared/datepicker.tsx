"use client";

import * as React from "react";
import { format, getMonth, getYear, setMonth, setYear } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  setDate?: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// Componente personalizado para forçar um z-index alto para o DatePicker
function CustomPopoverContent({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Content
      className={cn(
        "z-[9999] bg-popover text-popover-foreground rounded-md border p-0 shadow-md outline-hidden",
        className
      )}
      {...props}
    />
  );
}

export function DatePicker({
  date,
  onSelect,
  setDate,
  disabled = false,
  placeholder = "Selecione uma data",
  className,
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    date
  );
  const [currentMonth, setCurrentMonth] = React.useState<number>(
    date ? getMonth(date) : getMonth(new Date())
  );
  const [currentYear, setCurrentYear] = React.useState<number>(
    date ? getYear(date) : getYear(new Date())
  );

  // Referência para o mês exibido no calendário
  const [viewDate, setViewDate] = React.useState<Date>(
    date || new Date(getYear(new Date()), getMonth(new Date()))
  );

  // Nomes dos meses em português
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  // Atualiza o estado interno quando a prop date muda
  React.useEffect(() => {
    if (date) {
      setSelectedDate(date);
      setCurrentMonth(getMonth(date));
      setCurrentYear(getYear(date));
      setViewDate(date);
    }
  }, [date]);

  // Gerar anos para o select (30 anos anteriores e 30 anos futuros)
  const thisYear = getYear(new Date());
  const years = Array.from({ length: 101 }, (_, i) => thisYear - 80 + i);

  // Handler para mudança de ano
  const handleYearChange = (value: string) => {
    const selectedYear = parseInt(value);
    setCurrentYear(selectedYear);

    // Atualiza a data de visualização
    const newViewDate = setYear(viewDate, selectedYear);
    setViewDate(newViewDate);

    // Se já existir uma data selecionada, atualiza para o novo ano
    if (selectedDate) {
      const newDate = setYear(selectedDate, selectedYear);
      setSelectedDate(newDate);
      if (onSelect) onSelect(newDate);
    }
  };

  // Handler para mudança de mês
  const handleMonthChange = (value: string) => {
    const selectedMonth = parseInt(value);
    setCurrentMonth(selectedMonth);

    // Atualiza a data de visualização
    const newViewDate = setMonth(viewDate, selectedMonth);
    setViewDate(newViewDate);

    // Se já existir uma data selecionada, atualiza para o novo mês
    if (selectedDate) {
      const newDate = setMonth(selectedDate, selectedMonth);
      setSelectedDate(newDate);
      if (onSelect) onSelect(newDate);
    }
  };

  // Handler para seleção de data
  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setCurrentMonth(getMonth(date));
      setCurrentYear(getYear(date));
      setViewDate(date);
    }
    if (onSelect) onSelect(date);
    if (setDate) setDate(date);
  };

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>

      {/* Use o componente personalizado em vez do PopoverContent padrão */}
      <CustomPopoverContent align="start" sideOffset={4}>
        <div className="p-3 border-b space-y-2">
          {/* Seletor de Mês */}
          <Select
            value={currentMonth.toString()}
            onValueChange={handleMonthChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((month, index) => (
                <SelectItem key={month} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Seletor de Ano */}
          <Select
            value={currentYear.toString()}
            onValueChange={handleYearChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={ptBR}
          initialFocus
          defaultMonth={viewDate}
          month={viewDate}
          onMonthChange={setViewDate}
          disabled={disabled}
          captionLayout="buttons"
        />
      </CustomPopoverContent>
    </Popover>
  );
}
