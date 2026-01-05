import { Text, Button, Card, Center, Container, Group, Loader, Modal, Stack, TextInput, Menu, ActionIcon } from "@mantine/core";
import { addTask, deleteTask, getTasks, updateTask, updateTaskStatus } from "../api/api";
import { useDisclosure } from "@mantine/hooks";
import { hasLength, useForm } from "@mantine/form";
import type { Task } from "../types/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

export function Home() {
    const queryClient = useQueryClient();
    const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: getTasks,
        refetchOnWindowFocus: true,
    });


    const addTaskMutation = useMutation({
        mutationFn: addTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            addForm.reset();
            closeAddModal();
        },
        onError: (err) => {
            console.error('Ошибка при создании задачи:', err);
        }
    });


    const updateStatusMutation = useMutation({
        mutationFn: ({id, status}: {id: string; status: "current" | "completed"}) => updateTaskStatus(id, status),
        onSuccess: (updatedTask) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            notifications.show({
                title: updatedTask.status === 'completed' ? 'Задача завершена' : 'Задача возобновлена',
                message: updatedTask.status === 'completed' 
                ? 'Задача перемещена в завершенные' 
                : 'Задача возвращена в текущие',
                color: updatedTask.status === 'completed' ? 'green' : 'blue',
            });
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message,
                color: 'red',
            });
        },
    });


    const updateTaskMutation = useMutation({
        mutationFn: ({id, ...updates}: Partial<Task> & { id: string }) => updateTask(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            closeEditModal();
            notifications.show({
                title: 'Успешно',
                message: 'Задача обновлена',
                color: 'green',
            });
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: 'Не удалось обновить задачу',
                color: 'red',
            });
        },
    });

    const deleteTaskMutation = useMutation({
        mutationFn: (id: string) => deleteTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            notifications.show({
                title: 'Успешно',
                message: 'Задача удалена',
                color: 'green',
            });
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: 'Не удалось удалить задачу',
                color: 'red',
            });
        },
    })


    const addForm = useForm({
        initialValues: {
            title: '',
            description: '',
        },
        validate: {
            title: hasLength({ min: 2, max: 30 }, 'В названии должно быть от 2 до 30 символов'),
        },
    });

    const handleAddSubmit = async (values: typeof addForm.values) => {
        const taskData: Task = {
            id: Date.now().toString() + Math.random().toString(36).substr(2),
            title: values.title,
            description: values.description,
            status: "current"
        }
        addTaskMutation.mutate(taskData); 
    };


    const editForm = useForm({
        initialValues: {
            title: '',
            description: '',
        },
        validate: {
            title: hasLength({ min: 2, max: 30 }, 'В названии должно быть от 2 до 30 символов'),
        },
    });

    const handleEditSubmit = async (values: typeof editForm.values) => {
        if (editingTask) {
            updateTaskMutation.mutate({
                id: editingTask.id,
                title: values.title,
                description: values.description
            });
        }
    };

    const handleEditClick = (task: Task) => {
        setEditingTask(task);
        editForm.setValues({
            title: task.title,
            description: task.description
        });
        openEditModal();
    };


    const handleDeleteTask = (taskId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
            deleteTaskMutation.mutate(taskId);
        }
    };


    const handleCloseModal = () => {
        addForm.reset();
        closeAddModal();
    };


    

    const handleStatusToggle = (taskId: string, currentStatus: "current" | "completed") => {
        const newStatus = currentStatus === "current" ? "completed" : "current";
        updateStatusMutation.mutate({ id: taskId, status: newStatus });
    };

    const currentTasks = tasks.filter((task: Task) => task.status === 'current');
    const completedTasks = tasks.filter((task: Task) => task.status === 'completed');
    
    const EditIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
    );
    
    const DeleteIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
    );

    return (
        <Container size="md">
            <Center><h1>Список дел</h1></Center>
            
            <Modal opened={addModalOpened} onClose={handleCloseModal} title="Добавить задачу в список дел">
                <form onSubmit={addForm.onSubmit(handleAddSubmit)}>
                    <TextInput
                        label="Название задачи"
                        placeholder="Название задачи"
                        withAsterisk
                        {...addForm.getInputProps('title')}
                    />
                    <TextInput
                        label="Описание задачи"
                        placeholder="Описание задачи"
                        mt="md"
                        {...addForm.getInputProps('description')}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button 
                            type="submit"
                            loading={addTaskMutation.isPending}
                        >
                            Добавить
                        </Button>
                    </Group>
                </form>
            </Modal>

            <Modal opened={editModalOpened} onClose={closeEditModal} title="Редактировать задачу">
                <form onSubmit={editForm.onSubmit(handleEditSubmit)}>
                    <TextInput
                        label="Название задачи"
                        placeholder="Название задачи"
                        withAsterisk
                        {...editForm.getInputProps('title')}
                    />
                    <TextInput
                        label="Описание задачи"
                        placeholder="Описание задачи"
                        mt="md"
                        {...editForm.getInputProps('description')}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button 
                            type="submit"
                            loading={updateTaskMutation.isPending}
                        >
                            Сохранить
                        </Button>
                    </Group>
                </form>
            </Modal>

            <Group justify="space-between">
                <h2>Текущие задачи</h2>
                <Button onClick={openAddModal} size="md">
                    Добавить задачу
                </Button>
            </Group>
           
           {isLoading ? (
                <Center py="xl">
                    <Loader />
                </Center>
            ) : currentTasks.length > 0 ? (
                <Stack gap="md" mb="xl">
                    {currentTasks.map((task: Task) => (
                        <Card key={task.id} withBorder shadow="sm" padding="lg">
                            <Group justify="space-between" mb="xs">
                                <Stack>
                                    <Text fw={500}>{task.title}</Text>
                                    <Text size="sm" c="dimmed">
                                        {task.description}
                                    </Text>
                                </Stack>
                                
                                <Stack>
                                    <Menu>
                                        <Menu.Target>
                                            <Button 
                                                color="blue"
                                                loading={updateStatusMutation.isPending && updateStatusMutation.variables?.id === task.id}
                                            >Текущая</Button>
                                        </Menu.Target>
                                        
                                        <Menu.Dropdown>
                                            <Menu.Label><Center>Статус задачи</Center></Menu.Label>
                                            <Menu.Item>
                                                <Button disabled variant="light" size="xs">
                                                    Текущая
                                                </Button>
                                            </Menu.Item>
                                            <Menu.Item>
                                                <Button variant="light" size="xs"
                                                    onClick={() => handleStatusToggle(task.id, task.status)}
                                                >
                                                
                                                    Завершенная
                                                </Button>
                                            </Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                    <Center>
                                        <Group>
                                            <ActionIcon 
                                                onClick={() => handleEditClick(task)}
                                                loading={updateTaskMutation.isPending && updateTaskMutation.variables?.id === task.id}
                                            >
                                                <EditIcon></EditIcon>
                                            </ActionIcon>
                                            <ActionIcon
                                                onClick={() => handleDeleteTask(task.id)}
                                                loading={deleteTaskMutation.isPending && deleteTaskMutation.variables === task.id}    
                                            >
                                                <DeleteIcon></DeleteIcon>
                                            </ActionIcon>
                                        </Group>
                                    </Center>
                                </Stack>
                                
                            </Group>

                        </Card>
                    ))}
                </Stack>
            ) : (
                <Text c="dimmed" ta="center" py="xl">
                    Нет текущих задач. Добавьте первую задачу.
                </Text>
            )}

            <h2>Завершенные задачи</h2>
            {completedTasks.length > 0 ? (
                <Stack gap="md" mb="xl">
                    {completedTasks.map((task: Task) => (
                        <Card key={task.id} withBorder shadow="sm" padding="lg" style={{opacity: 0.6}}>
                            <Group justify="space-between" mb="xs">
                                <Stack>
                                    <Text fw={500}>{task.title}</Text>
                                    <Text size="sm" c="dimmed">
                                        {task.description}
                                    </Text>
                                </Stack>
                                
                                <Stack>
                                    <Menu>
                                        <Menu.Target>
                                            <Button 
                                                color="blue"
                                                loading={updateStatusMutation.isPending && updateStatusMutation.variables?.id === task.id}
                                            >Завершенная</Button>
                                        </Menu.Target>
                                        
                                        <Menu.Dropdown>
                                            <Menu.Label><Center>Статус задачи</Center></Menu.Label>
                                            <Menu.Item>
                                                <Button variant="light" size="xs"
                                                    onClick={() => handleStatusToggle(task.id, task.status)}
                                                >
                                                    Текущая
                                                </Button>
                                            </Menu.Item>
                                            <Menu.Item>
                                                <Button variant="light" size="xs" disabled>
                                                
                                                    Завершенная
                                                </Button>
                                            </Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                    <Center>
                                        <Group>
                                            <ActionIcon 
                                                onClick={() => handleEditClick(task)}
                                                loading={updateTaskMutation.isPending && updateTaskMutation.variables?.id === task.id}
                                            >
                                                <EditIcon></EditIcon>
                                            </ActionIcon>
                                            <ActionIcon
                                                onClick={() => handleDeleteTask(task.id)}
                                                loading={deleteTaskMutation.isPending && deleteTaskMutation.variables === task.id}    
                                            >
                                                <DeleteIcon></DeleteIcon>
                                            </ActionIcon>
                                        </Group>
                                    </Center>
                                </Stack>
                                
                            </Group>

                        </Card>
                    ))}
                </Stack>
            ) : (
                <Text c="dimmed" ta="center" py="xl">
                    Нет завершенных задач
                </Text>
            )}
            
        </Container>
    );
}