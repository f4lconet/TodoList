import axios from 'axios'
import type { Task } from '../types/types';

const API_BASE_URL = 'http://localhost:3000';

export const getTasks = () => axios
  .get(`${API_BASE_URL}/tasks`)
  .then(res => res.data)
  .catch(err => {
    console.log(err);
    throw err;
  });

export const addTask = (data: Task): Promise<Task> => axios
  .post(`${API_BASE_URL}/tasks`, data)
  .then(res => res.data)
  .catch(err => {
    console.log(err);
    throw err;
  });

export const updateTask = (id: string, updates: Partial<Task>): Promise<Task> => axios
  .patch(`${API_BASE_URL}/tasks/${id}`, updates)
  .then(res => res.data)
  .catch(err => {
    console.log(err);
    throw err;
  });

export const deleteTask = (id: string) => axios
  .delete(`${API_BASE_URL}/tasks/${id}`)
  .catch(err => {
    console.log(err);
    throw err;
  });

export const updateTaskStatus = (id: string, status: "current" | "completed"): Promise<Task> => axios
  .patch(`${API_BASE_URL}/tasks/${id}`, {status})
  .then(res => res.data)
  .catch(err => {
    console.log(err);
    throw err;
  });
