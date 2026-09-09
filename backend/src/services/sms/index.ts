import axios, { type AxiosInstance } from "axios";

export interface TemplateParameter {
  name: string;
  value: string;
}

export class SmsService {
  private readonly client: AxiosInstance;
  private readonly baseUrl = "https://api.sms.ir/v1";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("SmsService: API Key is missing.");
    }
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  async sendVerification(
    mobile: string,
    templateId: number,
    parameters: TemplateParameter[],
  ) {
    try {
      const response = await this.client.post("/send/verify", {
        mobile,
        templateId,
        parameters,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error, "sendVerification");
    }
  }

  async sendBulk(lineNumber: string, messageText: string, mobiles: string[]) {
    try {
      const response = await this.client.post("/send/bulk", {
        lineNumber,
        messageText,
        mobiles,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error, "sendBulk");
    }
  }

  private handleError(error: any, methodName: string) {
    console.error(
      `[SmsService Error] in ${methodName}:`,
      error.response?.data || error.message,
    );
    throw new Error(`Failed to send SMS via ${methodName}`);
  }
}

// Export a singleton instance if needed, or instantiate it where you need it
export const smsService = new SmsService(process.env.SMS_KEY!);
