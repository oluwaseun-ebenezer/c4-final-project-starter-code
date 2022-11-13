import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import CustomError from '../utils/failure'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodoUpdate } from '../models/TodoUpdate'
import { getAttachmentUrl, getUploadUrl } from '../helpers/attachmentUtils'
import {
  createTodoItem,
  deleteTodoItem,
  getTodoItemsByUser,
  updateAttachmentInTodoItem,
  updateTodoItem
} from '../helpers/todosAcess'

const logger = createLogger('businessLogic-todos')

export async function createTodo(
  userId: string,
  createTodoRequest: CreateTodoRequest
): Promise<TodoItem> {
  const todoId = uuid.v4()

  const item: TodoItem = {
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    done: false,
    attachmentUrl: null,
    ...createTodoRequest
  }

  try {
    await createTodoItem(item)
    logger.info('TODO item created successfully', {
      todoId,
      userId,
      todoItem: item
    })
    return item
  } catch (error) {
    logger.error(error)
    throw new CustomError(error.message, 500)
  }
}

export async function getTodos(userId: string): Promise<TodoItem[]> {
  try {
    const result = await getTodoItemsByUser(userId)
    logger.info(`TODO items of user fetched: ${userId}`, JSON.stringify(result))
    return result
  } catch (error) {
    logger.error(error)
    throw new CustomError(error.message, 500)
  }
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
): Promise<TodoItem> {
  try {
    const item = await updateTodoItem(
      userId,
      todoId,
      updateTodoRequest as TodoUpdate
    )
    logger.info('TODO item updated successfully', {
      userId,
      todoId,
      todoUpdate: updateTodoRequest
    })
    return item
  } catch (error) {
    logger.error(error)
    throw new CustomError(error.message, 500)
  }
}

export async function deleteTodo(
  userId: string,
  todoId: string
): Promise<TodoItem> {
  try {
    const item = await deleteTodoItem(userId, todoId)
    logger.info('TODO item deleted successfully', {
      userId,
      todoId
    })
    return item
  } catch (error) {
    logger.error(error)
    throw new CustomError(error.message, 500)
  }
}

export async function generateSignedUrl(attachmentId: string): Promise<string> {
  try {
    logger.info('Generating signedURL')
    const uploadURL = await getUploadUrl(attachmentId)
    logger.info('SignedURL generated')

    return uploadURL
  } catch (error) {
    logger.error(error)
    throw new CustomError(error.message, 500)
  }
}

export async function updateAttachmentUrl(
  userId: string,
  todoId: string,
  attachmentId: string
): Promise<void> {
  try {
    const attachmentURL = getAttachmentUrl(attachmentId)
    await updateAttachmentInTodoItem(userId, todoId, attachmentURL)

    logger.info('AttachmentURL updated successfully', {
      userId,
      todoId
    })
    return
  } catch (error) {
    logger.error(error)
    throw new CustomError(error.message, 500)
  }
}
