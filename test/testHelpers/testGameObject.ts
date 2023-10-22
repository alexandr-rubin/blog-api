import { GamePairViewModel } from "../../src/quiz/pair-quiz-game/models/view/GamePair"

export function testGameObject(game: GamePairViewModel) {
  const testObject: GamePairViewModel = {
    id: game.id,
    finishGameDate: game.finishGameDate,
    firstPlayerProgress: game.firstPlayerProgress,
    pairCreatedDate: game.pairCreatedDate,
    questions: game.questions,
    secondPlayerProgress: game.secondPlayerProgress,
    startGameDate: game.startGameDate,
    status: game.status,
  };

  return testObject
}
