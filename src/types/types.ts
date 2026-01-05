export interface Task {
    id: string;
    title: string;
    description: string;
    status: "current" | "completed";
}

export interface TasksResponse {
    tasks: Task[];
}