import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
const AWSXRay = require('aws-xray-sdk')
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'


const XAWS = AWSXRay.captureAWS(AWS)
const doc_client: DocumentClient = new XAWS.DynamoDB.DocumentClient()
const todos_table = process.env.TODOS_TABLE
const todosByUserIndex = process.env.TODOS_CREATED_AT_INDEX


export async function createTodoItem(item: TodoItem): Promise<void> {
  await doc_client
    .put({
      TableName: todos_table,
      Item: item
    }).promise()
}//createTodoItem



export async function getTodoItemsByUser(userId: string): Promise<TodoItem[]> {
  const result = await doc_client
    .query({
      TableName: todos_table,
      IndexName: todosByUserIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()

  return result.Items as TodoItem[]
}//getTodoItemsByUser



export async function getTodoItem(userId: string, todoId: string): Promise<TodoItem> {
  const result = await doc_client
    .get({
      TableName: todos_table,
      Key: {userId, todoId }
    }).promise()

  return result.Item as TodoItem
}//getTodoItem



export async function updateTodoItem(
  userId: string,
  todoId: string,
  todoUpdate: TodoUpdate
): Promise<TodoItem> {
  const result = await doc_client
    .update({
      TableName: todos_table,
      Key: {userId, todoId },
      UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': todoUpdate.name,
        ':dueDate': todoUpdate.dueDate,
        ':done': todoUpdate.done
        },
      ReturnValues: "ALL_NEW"
    }).promise()

    return result.Attributes  as TodoItem
}//updateTodoItem



export async function deleteTodoItem(userId: string, todoId: string): Promise<TodoItem> {
  const result = await doc_client
    .delete({
      TableName: todos_table,
      Key: { userId, todoId },
      ReturnValues: 'ALL_OLD',
    }).promise()

    return result.Attributes  as TodoItem
}//deleteTodoItem



export async function updateAttachmentInTodoItem(
  userId: string,
  todoId: string,
  attachmentUrl: string
): Promise<void> {
    await doc_client
    .update({
      TableName: todos_table,
      Key: { userId, todoId },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': attachmentUrl
      },
    }).promise()

  return
}//updateAttachmentInTodoItem