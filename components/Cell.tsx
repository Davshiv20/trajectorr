import { CellProps } from "./types";
import React from "react";

export function Cell({
    date,
    isLogged, 
    onToggle}: CellProps) {
        return (
            <button
            type="button"
            onClick={() => onToggle(date)}
            className={`cell ${isLogged ? 'cell-logged' : 'cell-empty'}`}
            aria-label={`${isLogged ? 'Logged' : 'Not logged'} on ${date.toLocaleDateString()}`}
    />
  );
}