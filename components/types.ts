export type CellProps = {
    date: Date;
    isLogged: boolean;
    processKey: string;
    onToggle: (date: Date)=>void;
}
export type ProcessRowProps = {
    process: {
        id: string;
        name: string;
        category: string;
        key: string; 
    };
    dates: Date[];
    loggedDates: Set<string>;
    onToggle: (processId: string, date: Date)=>void;
}

export type Process = {
    id: string;
    name: string;
    category: string;
    key: string; 
}

export type Log = {
    process_id: string;
    logged_at: string;
}

export type ActivityGridProps = {
    processes: Process[];
    logs: Log[];
    onToggle: (processId: string, date: Date)=>void;
}

export type TimeRangeToggleProps = {
    value : 7 | 14 ;
    onChange: (value: 7 | 14 )=>void;
}

export type LoginProps = {
    onSignIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    onSignUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  }


export type AddProcessModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string, category: string, key: string) => Promise<void>;
}

export type OnboardingProps = {
    onAddProcess: () => void;
}