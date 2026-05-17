import { integralQuestions } from "./integralQuestions.js";

export function getIntegralGraphConfig(questionId) {
  return integralQuestions.find((question) => question.id === questionId) ?? null;
}
