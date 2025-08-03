import { RequestHandler } from "express";
import { generateAIResponse } from "../services/ai/langchainService";
import * as ResponseHelper from "../utils/responseHelper";

// Test endpoint for AI functionality
export const testAIController: RequestHandler = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      ResponseHelper.badRequest(res, "Message is required", "Missing message");
      return;
    }

    const response = await generateAIResponse({
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const responseData: any = {
      response: response.content,
      toolsUsed: response.toolsUsed,
      error: response.error,
    };

    // Add chartData if present
    if (response.chartData) {
      responseData.chartData = response.chartData;
    }

    ResponseHelper.success(
      res,
      responseData,
      "AI response generated successfully"
    );
  } catch (error: any) {
    ResponseHelper.error(res, error.message, "Failed to generate AI response");
  }
};
