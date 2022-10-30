import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const logger = createLogger('TodosAccess')

const XAWS = AWSXRay.captureAWS(AWS)
export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosTablePartitionKey = process.env.TODOS_CREATED_AT_INDEX
  ) {}

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting todos', { userId })

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.todosTablePartitionKey,
        KeyConditionExpression: 'paritionKey = :paritionKey',
        ExpressionAttributeValues: {
          ':paritionKey': userId
        }
      })
      .promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    logger.info('Creating todo', { userId: todo.userId })

    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todo
      })
      .promise()

    return todo
  }

  async updateTodo(
    todo: TodoUpdate,
    id: string,
    userId: string
  ): Promise<TodoUpdate> {
    logger.info('Updating todo', { id, userId })

    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: { todoId: id, userId: userId },
        UpdateExpression: 'set name = :r, done = :done, dueDate = :dueDate',
        ExpressionAttributeValues: {
          ':name': todo.name,
          ':done': todo.done,
          ':dueDate': todo.dueDate
        }
      })
      .promise()

    return todo
  }

  async deleteTodo(id: string, userId: string): Promise<string> {
    logger.info('Deleting todo', { id, userId })

    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: { todoId: id, userId: userId }
      })
      .promise()

    return id
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    logger.info('Creating a local DynamoDB instance', {})
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
