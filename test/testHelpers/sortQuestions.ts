import { QuizQuestionViewModel } from "../../src/quiz/quiz-questions/models/view/quiz-question";

export function sortQuestions(originalQuestions: QuizQuestionViewModel[], field: string, sortOrder: "asc" | "desc") {
  const sortedQuestions = [...originalQuestions];

  sortedQuestions.sort((a, b) => {
    if (sortOrder === "asc") {
      if (a[field] < b[field]) {
        return -1
      } else if (a[field] > b[field]) {
        return 1
      }
      return 0
    } else if (sortOrder === "desc") {
      if (a[field] < b[field]) {
        return 1
      } else if (a[field] > b[field]) {
        return -1
      }
      return 0
    }
    // По умолчанию, если sortOrder не "asc" и не "desc", вернуть 0 (без сортировки)
    return 0
  })

  return sortedQuestions
}
