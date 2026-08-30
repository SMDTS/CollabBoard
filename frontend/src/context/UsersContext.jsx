// UsersContext.jsx
// Read-only on purpose — there's no add/edit/delete because users are
// created via registration (AuthContext), not managed here. This just
// gives every page "who's on the team" without each fetching separately.
import { createContext, useContext, useState, useEffect } from "react";
import * as usersApi from "../api/users.js";

const UsersContext = createContext(null);

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    usersApi
      .fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return <UsersContext.Provider value={{ users, isLoading, error }}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  return useContext(UsersContext);
}
