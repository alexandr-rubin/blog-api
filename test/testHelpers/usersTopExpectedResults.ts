export function removePlayersId(players){
  const playersWithoutIds = players.map(({ player: { id, ...playerWithoutId }, ...rest }) => ({
    ...rest,
    player: playerWithoutId
  }))

  return playersWithoutIds
}

export const avgScoreDesc = [
  {
      "sumScore": 13,
      "avgScores": 2.6,
      "gamesCount": 5,
      "winsCount": 3,
      "lossesCount": 2,
      "drawsCount": 0,
      "player": {
          "id": "ba6ea213-48e3-4f1f-8162-e68b8027d36f",
          "login": "testing"
      }
  },
  {
      "sumScore": 17,
      "avgScores": 2.43,
      "gamesCount": 7,
      "winsCount": 3,
      "lossesCount": 3,
      "drawsCount": 1,
      "player": {
          "id": "238eebd7-2a58-4ec9-8e17-ec898fa84e8b",
          "login": "qwerty"
      }
  },
  {
      "sumScore": 7,
      "avgScores": 2.33,
      "gamesCount": 3,
      "winsCount": 1,
      "lossesCount": 2,
      "drawsCount": 0,
      "player": {
          "id": "f09157e1-293b-4916-a73a-bbd0cec9814b",
          "login": "zxczxc"
      }
  },
  {
      "sumScore": 2,
      "avgScores": 2,
      "gamesCount": 1,
      "winsCount": 0,
      "lossesCount": 0,
      "drawsCount": 1,
      "player": {
          "id": "3eb00dfc-ad4f-4252-a692-cc1b53b66bbb",
          "login": "asdfgh"
      }
  }
]

export const pageSize3SumScoreDescAvgScoreDesc = [
  {
      "sumScore": 17,
      "avgScores": 2.43,
      "gamesCount": 7,
      "winsCount": 3,
      "lossesCount": 3,
      "drawsCount": 1,
      "player": {
          "id": "238eebd7-2a58-4ec9-8e17-ec898fa84e8b",
          "login": "qwerty"
      }
  },
  {
      "sumScore": 13,
      "avgScores": 2.6,
      "gamesCount": 5,
      "winsCount": 3,
      "lossesCount": 2,
      "drawsCount": 0,
      "player": {
          "id": "ba6ea213-48e3-4f1f-8162-e68b8027d36f",
          "login": "testing"
      }
  },
  {
      "sumScore": 7,
      "avgScores": 2.33,
      "gamesCount": 3,
      "winsCount": 1,
      "lossesCount": 2,
      "drawsCount": 0,
      "player": {
          "id": "f09157e1-293b-4916-a73a-bbd0cec9814b",
          "login": "zxczxc"
      }
  }
]