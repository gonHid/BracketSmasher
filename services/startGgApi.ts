import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://api.start.gg/gql/alpha";

export async function executeStartGgQuery(
  query: string,
  variables = {}
) {
  const token = await AsyncStorage.getItem("userToken");

  if (!token)
    throw new Error("No existe token OAuth.");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await response.json();

  if (json.errors)
    throw new Error(json.errors[0].message);

  return json.data;
}

export const GET_MY_TOURNAMENTS = `
query GetMyTournaments {
  currentUser {
    tournaments(query: { perPage: 20 }) {
      nodes {
        id
        name
        slug
        startAt
        endAt
      }
    }
  }
}
`;

export const GET_MY_PROFILE = `
query GetMyProfile {
  currentUser {
    id
    name
    player {
      id
      gamerTag
    }
  }
}
`;

export const GET_SETS = `
query GetSets($eventId: ID!, $page: Int!) {

  event(id: $eventId) {

    id
    name

    # 👇 NUEVO
    tournament {
      id
      startAt
    }

    sets(
      page: $page
      perPage: 25
      sortType: STANDARD
    ) {

      pageInfo {
        totalPages
      }

      nodes {

        id
        identifier
        fullRoundText
        state
        completedAt
        startAt
        winnerId
        round

        slots {

          standing {

            placement

            stats {
              score {
                value
              }
            }

          }

          entrant {

            id
            name

            participants {

              gamerTag

              player {
                id
              }

            }

          }

        }

      }

    }

  }

}
`;