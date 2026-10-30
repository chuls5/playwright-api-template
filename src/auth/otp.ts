/** Supplies the answer to a step-up challenge. */
export interface OtpProvider {
  readonly type: 'OTP' | 'TAX_IDENTIFICATION_NO';
  answer(): Promise<string>;
}

/** Fixed value from env (QA environments with a constant OTP). */
export const staticOtp = (value: string): OtpProvider => ({ type: 'OTP', answer: async () => value });
/** Caller-supplied answer, for wrong-OTP negative tests. */
export const overrideOtp = (value: string): OtpProvider => ({ type: 'OTP', answer: async () => value });
/** SSN step-up variant: answers with the user's synthetic SSN. */
export const ssnStepUp = (ssn: string): OtpProvider => ({ type: 'TAX_IDENTIFICATION_NO', answer: async () => ssn });
