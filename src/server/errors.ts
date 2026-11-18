export class ValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  status = 401;
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  status = 403;
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class DatabaseError extends Error {
  status = 500;
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class PaymentError extends Error {
  status = 502;
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

