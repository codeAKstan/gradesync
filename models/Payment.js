export class Payment {
  constructor(data) {
    this.studentId = data.studentId;
    this.reference = data.reference;
    this.status = data.status || 'initialized';
    this.amount = data.amount;
    this.currency = data.currency || 'NGN';
    this.purpose = data.purpose || 'fees';
    this.authorizationUrl = data.authorizationUrl;
    this.gatewayResponse = data.gatewayResponse || null;
    this.paidAt = data.paidAt || null;
    this.transactionId = data.transactionId || null;
    this.channel = data.channel || null;
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  validate() {
    const errors = [];
    if (!this.studentId) errors.push('studentId is required');
    if (!this.amount || Number(this.amount) <= 0) errors.push('amount must be positive');
    return { isValid: errors.length === 0, errors };
  }

  toObject() {
    return {
      studentId: this.studentId,
      reference: this.reference,
      status: this.status,
      amount: this.amount,
      currency: this.currency,
      purpose: this.purpose,
      authorizationUrl: this.authorizationUrl,
      gatewayResponse: this.gatewayResponse,
      paidAt: this.paidAt,
      transactionId: this.transactionId,
      channel: this.channel,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}