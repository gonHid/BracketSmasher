// services/startGgApi.ts

const API_URL = 'https://api.start.gg/gql/alpha';

/**
 * Servicio centralizado para ejecutar consultas a Start.gg
 */
export const executeStartGgQuery = async (query: string, token: string, variables = {}) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    // Si hay error en la query, lanzamos excepción
    throw new Error(result.errors[0].message);
  }
  return result.data;
};

/**
 * Consulta para obtener torneos del usuario actual
 */
export const GET_MY_TOURNAMENTS = `
query GetMyTournaments {
  currentUser {
    tournaments(query: { perPage: 10, filter: { past: false } }) {
      nodes {
        id
        name
        slug
        startAt
      }
    }
  }
}
`;