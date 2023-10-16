export const incorrectInputsForUpdateAndPost = {
  incorrectBodyQuestionsInputMinLength:
  {
    "body": "updated",
    "correctAnswers": ["answer", "answer", "answer"],
  },
  incorrectBodyQuestionsInputNotString:
  {
    "body": 5,
    "correctAnswers": ["answer", "answer", "answer"],
  },
  incorrectBodyQuestionsInputMaxLength:
  {
    "body": 'a'.repeat(501),
    "correctAnswers": ["answer", "answer", "answer"],
  },
  incorrectBodyQuestionsInputEmpty:
  {
    "body": '',
    "correctAnswers": ["answer", "answer", "answer"],
  },
  incorrectBodyQuestionsInputOnlySpaces:
  {
    "body": '        ',
    "correctAnswers": ["answer", "answer", "answer"],
  },
  incorrectAnswersInputEmptyArray:
  {
    "body": "updated, test question body, test question body, test question body",
    "correctAnswers": [],
  }
}

export const incorrectInputsForPublish = {
  incorrectPublishStatus:
  {
    published: 'true'
  }
}