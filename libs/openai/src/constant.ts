export const TOKEN_PER_QUESTION_OR_ANSWER = 40;
export const MAX_TOKEN = 16000;
export const TOKEN_IN_CONTEXT = 300; //count by lambda
export const MAX_COMPLETION_TOKEN = MAX_TOKEN - TOKEN_IN_CONTEXT - 400; // 400 is buffer token for content
