import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'

const todoAccess = new TodosAccess()

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  return todoAccess.getAllTodos(userId)
}

export async function createTodo(
  CreateTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const itemId = uuid.v4()

  return await todoAccess.createTodo({
    userId: userId,
    todoId: itemId,
    createdAt: new Date().toISOString(),
    name: CreateTodoRequest.name,
    dueDate: CreateTodoRequest.dueDate,
    done: false
  })
}

export async function updateTodo(
  UpdateTodoRequest: UpdateTodoRequest,
  id: string,
  userId: string
): Promise<TodoUpdate> {
  return await todoAccess.updateTodo(
    {
      name: UpdateTodoRequest.name,
      dueDate: UpdateTodoRequest.dueDate,
      done: UpdateTodoRequest.done
    },
    id,
    userId
  )
}

export async function deleteTodo(id: string, userId: string): Promise<string> {
  return await todoAccess.deleteTodo(id, userId)
}

export async function createAttachmentPresignedUrl(
  todoId: string
): Promise<string> {
  return await new AttachmentUtils().createAttachmentPresignedUrl(todoId)
}
