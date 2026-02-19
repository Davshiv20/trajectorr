import {Cell } from './Cell'
import React from 'react'
import { ProcessRowProps } from './types'

export function ProcessRow({
    process, dates, loggedDates, onToggle}: ProcessRowProps
){
    return(
        <div className="flex gap-[var(--cell-gap)]">
            {/* No label here - it's in ActivityGrid now */}
            {dates.map((date)=>{
                const dateKey = date.toISOString().split('T')[0];
                return(
                    <Cell 
                    key={dateKey}
                    date={date}
                    isLogged={loggedDates.has(dateKey)} 
                    processKey={process.key} 
                    onToggle={(date)=>onToggle(process.id, date)} />
                );
            })}
        </div>
    );
}