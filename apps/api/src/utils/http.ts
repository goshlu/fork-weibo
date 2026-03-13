import { ZodError } from 'zod';

export function toErrorResponse(error: unknown): { statusCode: number; message: string } {
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      message: error.issues[0]?.message ?? 'Invalid request payload',
    };
  }

  if (typeof error === 'object' && error !== null) {
    const maybeStatus = Reflect.get(error, 'statusCode');
    const maybeMessage = Reflect.get(error, 'message');
    if (typeof maybeStatus === 'number' && maybeStatus >= 400 && maybeStatus < 600) {
      return {
        statusCode: maybeStatus,
        message: typeof maybeMessage === 'string' ? maybeMessage : 'Request failed',
      };
    }
  }

  if (error instanceof Error) {
    if (error.message === 'USERNAME_EXISTS') {
      return { statusCode: 409, message: 'Username already exists' };
    }
    if (error.message === 'INVALID_CREDENTIALS') {
      return { statusCode: 401, message: 'Invalid username or password' };
    }
    if (error.message === 'FORBIDDEN') {
      return { statusCode: 403, message: 'You do not have permission to perform this action' };
    }
    if (error.message === 'SENSITIVE_CONTENT') {
      return { statusCode: 400, message: 'Content contains blocked words' };
    }
    if (error.message === 'INVALID_IMAGE') {
      return { statusCode: 400, message: 'Only image files are supported' };
    }
    if (error.message === 'TOO_MANY_IMAGES') {
      return { statusCode: 400, message: 'A post can contain up to 9 images' };
    }
    if (error.message === 'POST_NOT_FOUND') {
      return { statusCode: 404, message: 'Post not found' };
    }
    if (error.message === 'COMMENT_NOT_FOUND') {
      return { statusCode: 404, message: 'Comment not found' };
    }
    if (error.message === 'USER_NOT_FOUND') {
      return { statusCode: 404, message: 'User not found' };
    }
    if (error.message === 'INVALID_FOLLOW') {
      return { statusCode: 400, message: 'You cannot follow yourself' };
    }
  }

  return {
    statusCode: 500,
    message: 'Internal server error',
  };
}
