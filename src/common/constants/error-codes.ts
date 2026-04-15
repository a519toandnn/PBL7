export enum ErrorCode {
  // General
  SUCCESS = 1000,
  BAD_REQUEST = 1001,
  UNAUTHORIZED = 1002,
  FORBIDDEN = 1003,
  NOT_FOUND = 1004,
  CONFLICT = 1005,
  INTERNAL_SERVER_ERROR = 1006,
  VALIDATION_ERROR = 1007,

  // Auth
  INVALID_CREDENTIALS = 2001,
  TOKEN_EXPIRED = 2002,
  TOKEN_INVALID = 2003,
  USER_NOT_FOUND = 2004,
  USER_ALREADY_EXISTS = 2005,

  // Validation
  INVALID_EMAIL = 3001,
  INVALID_PASSWORD = 3002,
  PASSWORD_TOO_SHORT = 3003,
  PASSWORDS_NOT_MATCH = 3004,
  INVALID_PHONE = 3005,

  // User
  USER_EMAIL_DUPLICATE = 4001,
  USER_PROFILE_UPDATE_FAILED = 4002,
  ADDRESS_NOT_FOUND = 4003,
  ADDRESS_UPDATE_FAILED = 4004,

  // Medicine
  MEDICINE_NOT_FOUND = 5001,
  CATEGORY_NOT_FOUND = 5002,

  // Cart & Order
  CART_EMPTY = 6001,
  ORDER_CREATION_FAILED = 6002,
  PAYMENT_FAILED = 6003,
}

export const ERROR_CODE_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.SUCCESS]: 'Success',
  [ErrorCode.BAD_REQUEST]: 'Bad Request',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized',
  [ErrorCode.FORBIDDEN]: 'Forbidden',
  [ErrorCode.NOT_FOUND]: 'Not Found',
  [ErrorCode.CONFLICT]: 'Conflict',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [ErrorCode.VALIDATION_ERROR]: 'Validation Error',

  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.TOKEN_EXPIRED]: 'Token has expired',
  [ErrorCode.TOKEN_INVALID]: 'Token is invalid',
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',

  [ErrorCode.INVALID_EMAIL]: 'Invalid email format',
  [ErrorCode.INVALID_PASSWORD]: 'Invalid password',
  [ErrorCode.PASSWORD_TOO_SHORT]: 'Password is too short',
  [ErrorCode.PASSWORDS_NOT_MATCH]: 'Passwords do not match',
  [ErrorCode.INVALID_PHONE]: 'Invalid phone number',

  [ErrorCode.USER_EMAIL_DUPLICATE]: 'Email already exists',
  [ErrorCode.USER_PROFILE_UPDATE_FAILED]: 'Failed to update user profile',
  [ErrorCode.ADDRESS_NOT_FOUND]: 'Address not found',
  [ErrorCode.ADDRESS_UPDATE_FAILED]: 'Failed to update address',

  [ErrorCode.MEDICINE_NOT_FOUND]: 'Medicine not found',
  [ErrorCode.CATEGORY_NOT_FOUND]: 'Category not found',

  [ErrorCode.CART_EMPTY]: 'Cart is empty',
  [ErrorCode.ORDER_CREATION_FAILED]: 'Failed to create order',
  [ErrorCode.PAYMENT_FAILED]: 'Payment failed',
};
