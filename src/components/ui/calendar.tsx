'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface CalendarProps {
  mode?: 'single' | 'range' | 'multiple';
  selected?: Date | Date[] | DateRange;
  onSelect?: (date: Date | DateRange | Date[]) => void;
  disabled?: (date: Date) => boolean;
  initialFocus?: boolean;
}

export function Calendar({ selected, onSelect, className, disabled }: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(selected || new Date());
  const [viewDate, setViewDate] = React.useState(new Date(currentDate));

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (disabled?.(newDate)) return;
    onSelect?.(newDate);
    setCurrentDate(newDate);
  };

  const handleMonthChange = (increment: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + increment, 1));
  };

  const renderDays = () => {
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Render week days
    days.push(
      <div key="weekdays" className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm text-gray-500">
            {day}
          </div>
        ))}
      </div>
    );

    // Render calendar days
    let dayCount = 1;
    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDayOfMonth) {
          week.push(<div key={`empty-${j}`} className="p-2" />);
        } else if (dayCount <= daysInMonth) {
          const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), dayCount);
          const isDisabled = disabled?.(date);
          const isSelected = currentDate.toDateString() === date.toDateString();

          week.push(
            <Button
              key={dayCount}
              variant="ghost"
              className={cn(
                'w-full h-9 p-0',
                isSelected && 'bg-primary text-primary-foreground',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
              disabled={isDisabled}
              onClick={() => handleDateSelect(dayCount)}
            >
              {dayCount}
            </Button>
          );
          dayCount++;
        }
      }
      if (dayCount <= daysInMonth) {
        days.push(
          <div key={`week-${i}`} className="grid grid-cols-7 gap-1">
            {week}
          </div>
        );
      }
    }

    return days;
  };

  return (
    <div className={cn('p-3', className)}>
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => handleMonthChange(-1)} className="h-7 w-7 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <Button variant="ghost" onClick={() => handleMonthChange(1)} className="h-7 w-7 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {renderDays()}
    </div>
  );
}
