/**
 * Custom Error Classes for QueryFlow API
 * Provides structured error handling for blockchain, payment, and service operations
 */

// =============================================================================
// ERROR CODES
// =============================================================================

export enum ErrorCode {
  // Blockchain errors (1xxx)
  BLOCKCHAIN_CONNECTION_FAILED = "BLOCKCHAIN_1001",
  CONTRACT_CALL_FAILED = "BLOCKCHAIN_1002",
  TRANSACTION_FAILED = "BLOCKCHAIN_1003",
  INSUFFICIENT_GAS = "BLOCKCHAIN_1004",

  // Payment errors (2xxx)
  PAYMENT_REQUIRED = "PAYMENT_2001",
  INVALID_SIGNATURE = "PAYMENT_2002",
  INSUFFICIENT_PAYMENT = "PAYMENT_2003",
  PAYMENT_EXPIRED = "PAYMENT_2004",

  // Service errors (3xxx)
  AI_SERVICE_ERROR = "SERVICE_3001",
  DATA_FETCH_ERROR = "SERVICE_3002",
  RATE_LIMIT_EXCEEDED = "SERVICE_3003",

  // Validation errors (4xxx)
  INVALID_REQUEST = "VALIDATION_4001",
  INVALID_ADDRESS = "VALIDATION_4002",
}

// =============================================================================
// BASE ERROR CLASS
// =============================================================================

export class QueryFlowError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly timestamp: number;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = "QueryFlowError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
      timestamp: this.timestamp,
    };
  }
}

// =============================================================================
// BLOCKCHAIN ERRORS
// =============================================================================

export class BlockchainError extends QueryFlowError {
  constructor(message: string, code: ErrorCode, details?: unknown) {
    super(message, code, 503, details);
    this.name = "BlockchainError";
  }
}

export class ContractCallError extends BlockchainError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.CONTRACT_CALL_FAILED, details);
    this.name = "ContractCallError";
  }
}

export class TransactionFailedError extends BlockchainError {
  public readonly txHash?: string;

  constructor(message: string, txHash?: string, details?: unknown) {
    super(message, ErrorCode.TRANSACTION_FAILED, details);
    this.name = "TransactionFailedError";
    this.txHash = txHash;
  }
}

export class InsufficientGasError extends BlockchainError {
  constructor(
    message: string = "Insufficient gas for transaction",
    details?: unknown
  ) {
    super(message, ErrorCode.INSUFFICIENT_GAS, details);
    this.name = "InsufficientGasError";
  }
}

// =============================================================================
// PAYMENT ERRORS
// =============================================================================

export class PaymentError extends QueryFlowError {
  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 402,
    details?: unknown
  ) {
    super(message, code, statusCode, details);
    this.name = "PaymentError";
  }
}

export class PaymentRequiredError extends PaymentError {
  public readonly price: number;
  public readonly paymentAddress: string;
  public readonly nonce: string;

  constructor(price: number, paymentAddress: string, nonce: string) {
    super("Payment Required", ErrorCode.PAYMENT_REQUIRED, 402, {
      price,
      paymentAddress,
      nonce,
    });
    this.name = "PaymentRequiredError";
    this.price = price;
    this.paymentAddress = paymentAddress;
    this.nonce = nonce;
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: "Payment Required",
        details: {
          price: this.price,
          paymentAddress: this.paymentAddress,
          nonce: this.nonce,
          instructions: "Sign payment with your wallet",
        },
      },
      timestamp: this.timestamp,
    };
  }
}

export class InvalidSignatureError extends PaymentError {
  constructor(
    message: string = "Invalid payment signature",
    details?: unknown
  ) {
    super(message, ErrorCode.INVALID_SIGNATURE, 401, details);
    this.name = "InvalidSignatureError";
  }
}

// =============================================================================
// SERVICE ERRORS
// =============================================================================

export class ServiceError extends QueryFlowError {
  constructor(message: string, code: ErrorCode, details?: unknown) {
    super(message, code, 503, details);
    this.name = "ServiceError";
  }
}

export class AIServiceError extends ServiceError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.AI_SERVICE_ERROR, details);
    this.name = "AIServiceError";
  }
}

export class DataFetchError extends ServiceError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.DATA_FETCH_ERROR, details);
    this.name = "DataFetchError";
  }
}

export class RateLimitError extends ServiceError {
  public readonly retryAfter?: number;

  constructor(message: string = "Rate limit exceeded", retryAfter?: number) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, { retryAfter });
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Wraps an async function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, onRetry } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < retries) {
        onRetry?.(lastError, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Type guard to check if error is a QueryFlowError
 */
export function isQueryFlowError(error: unknown): error is QueryFlowError {
  return error instanceof QueryFlowError;
}
