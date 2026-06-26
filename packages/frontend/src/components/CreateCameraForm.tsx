import { useState } from "react";
import {
  Field,
  Input,
  Button,
  Text,
  makeStyles,
} from "@fluentui/react-components";
import { useMutation } from "urql";
import { ADD_CAMERA } from "../graphql/operations";
import type { AddCameraData, AddCameraVars } from "../graphql/types";
import { getErrorMessage } from "../graphql/errors";

const useStyles = makeStyles({
  root: {
    marginTop: "32px",
    borderTop: "1px solid #e0e0e0",
    paddingTop: "24px",
  },
  fieldRow: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  field: {
    flex: "1 1 140px",
    // Reserve space for the validation message line so fields always occupy
    // the same height — prevents siblings from shifting when an error appears.
    minHeight: "76px",
  },
  createButton: {
    alignSelf: "flex-end",
    marginBottom: "2px",
  },
});

export function CreateCameraForm() {
  const styles = useStyles();

  const [name, setName] = useState("");
  const [niceName, setNiceName] = useState("");
  const [address, setAddress] = useState("");
  // Only show validation errors after the user has attempted a submit.
  const [submitted, setSubmitted] = useState(false);

  const [createResult, executeCreate] = useMutation<
    AddCameraData,
    AddCameraVars
  >(ADD_CAMERA);

  const nameEmpty = name.trim() === "";
  const addressEmpty = address.trim() === "";
  const isInvalid = nameEmpty || addressEmpty;

  async function handleCreate() {
    setSubmitted(true);
    if (isInvalid) return;
    const result = await executeCreate({
      name: name.trim(),
      address: address.trim(),
      niceName: niceName.trim() || undefined,
    });
    if (result.data) {
      setName("");
      setNiceName("");
      setAddress("");
      setSubmitted(false);
    }
  }

  const errorMessage = getErrorMessage(createResult.error);

  return (
    <div className={styles.root}>
      <Text weight="semibold" block style={{ marginBottom: "12px" }}>
        Register new camera
      </Text>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <Field
            label="Name"
            required
            validationState={submitted && nameEmpty ? "error" : "none"}
            validationMessage={
              submitted && nameEmpty ? "Name is required" : undefined
            }
          >
            <Input
              value={name}
              onChange={(_, data) => setName(data.value)}
              placeholder="e.g. A8207-VE"
            />
          </Field>
        </div>
        <div className={styles.field}>
          <Field label="Friendly name">
            <Input
              value={niceName}
              onChange={(_, data) => setNiceName(data.value)}
              placeholder="e.g. Front Door"
            />
          </Field>
        </div>
        <div className={styles.field}>
          <Field
            label="IP address"
            required
            validationState={submitted && addressEmpty ? "error" : "none"}
            validationMessage={
              submitted && addressEmpty ? "Address is required" : undefined
            }
          >
            <Input
              value={address}
              onChange={(_, data) => setAddress(data.value)}
              placeholder="e.g. 192.168.1.10"
            />
          </Field>
        </div>
        <Button
          className={styles.createButton}
          appearance="primary"
          disabled={createResult.fetching}
          onClick={handleCreate}
        >
          {createResult.fetching ? "Creating…" : "Create"}
        </Button>
      </div>
      {errorMessage && (
        <Text role="alert" style={{ color: "red", marginTop: "8px" }} block>
          {errorMessage}
        </Text>
      )}
    </div>
  );
}
