import React, { useState } from "react";
import {
  Field,
  Input,
  Button,
  Text,
  makeStyles,
} from "@fluentui/react-components";
import { useMutation } from "urql";
import { LOGIN } from "../graphql/operations";
import { LoginData, LoginVars } from "../graphql/types";
import { getErrorMessage } from "../graphql/errors";
import { useAuth } from "../auth/AuthContext";

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "360px",
    margin: "80px auto",
    padding: "32px",
  },
});

export function LoginForm() {
  const styles = useStyles();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginResult, executeLogin] = useMutation<LoginData, LoginVars>(LOGIN);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await executeLogin({ username, password });
    if (result.data) {
      login(result.data.login.token);
    }
  }

  const errorMessage = getErrorMessage(loginResult.error);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Field label="Username" required>
        <Input
          value={username}
          onChange={(_, data) => setUsername(data.value)}
          autoComplete="username"
        />
      </Field>
      <Field label="Password" required>
        <Input
          type="password"
          value={password}
          onChange={(_, data) => setPassword(data.value)}
          autoComplete="current-password"
        />
      </Field>
      {errorMessage && (
        <Text style={{ color: "red" }} role="alert">
          {errorMessage}
        </Text>
      )}
      <Button
        type="submit"
        appearance="primary"
        disabled={loginResult.fetching}
      >
        {loginResult.fetching ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
