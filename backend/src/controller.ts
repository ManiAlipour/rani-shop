import autoBind from "auto-bind";
import type { Response } from "express";

export default class Controller {
  constructor() {
    autoBind(this);
  }

  sendResponse<T>(
    res: Response,
    data: T | unknown = [],
    status: number = 200,
    message: string = "ok!",
  ) {
    return res.status(status).json({ success: true, data, message });
  }

  sendError(res: Response, message: string, status: number) {
    return this.sendResponse(res, null, status, message);
  }

  sendServerError(res: Response) {
    return this.sendResponse(res, null, 500, "خطا در ارتباط با سرور");
  }
}
