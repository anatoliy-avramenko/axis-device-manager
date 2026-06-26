import { useState } from "react";
import {
  Text,
  Button,
  Spinner,
  Select,
  Title2,
  makeStyles,
} from "@fluentui/react-components";
import { useQuery, useMutation } from "urql";
import {
  ME,
  CAMERAS,
  ADD_CAMERA_TO_USER,
  REMOVE_CAMERA_FROM_USER,
} from "../graphql/operations";
import type {
  MeData,
  CamerasData,
  AddCameraToUserVars,
  AddCameraToUserData,
  RemoveCameraFromUserVars,
  RemoveCameraFromUserData,
} from "../graphql/types";
import { getErrorMessage } from "../graphql/errors";
import { useAuth } from "../auth/AuthContext";
import { CreateCameraForm } from "./CreateCameraForm";

// Stable references — must not be inline inside the component or urql sees a
// new object every render and triggers an infinite re-fetch loop.
const ME_QUERY_CONTEXT = { additionalTypenames: ["User"] };
// additionalTypenames: ["Camera"] ensures a newly-created camera (from
// CreateCameraForm) invalidates this query even when the list was empty and
// urql's cache never recorded a Camera typename for it.
const CAMERAS_QUERY_CONTEXT = { additionalTypenames: ["Camera"] };

const useStyles = makeStyles({
  root: {
    padding: "32px",
    maxWidth: "600px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  cameraItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #e0e0e0",
  },
  addSection: {
    marginTop: "24px",
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
});

export function CameraList() {
  const styles = useStyles();
  const { logout } = useAuth();

  const [selectedCameraId, setSelectedCameraId] = useState("");

  // Fetch current user's cameras; invalidate when any User mutation fires.
  const [meResult] = useQuery<MeData>({
    query: ME,
    context: ME_QUERY_CONTEXT,
  });

  // Fetch all cameras to build the "available to add" picker.
  // additionalTypenames: ["Camera"] ensures the list refreshes after
  // CreateCameraForm registers a new camera in the pool.
  const [camerasResult] = useQuery<CamerasData>({
    query: CAMERAS,
    context: CAMERAS_QUERY_CONTEXT,
  });

  const [addToUserResult, executeAddCamera] = useMutation<
    AddCameraToUserData,
    AddCameraToUserVars
  >(ADD_CAMERA_TO_USER);
  const [removeResult, executeRemoveCamera] = useMutation<
    RemoveCameraFromUserData,
    RemoveCameraFromUserVars
  >(REMOVE_CAMERA_FROM_USER);

  const ownedCameras = meResult.data?.me?.cameras ?? [];
  const allCameras = camerasResult.data?.cameras ?? [];

  const ownedCameraIds = new Set(ownedCameras.map((c) => c.id));
  const unassignedCameras = allCameras.filter((c) => !ownedCameraIds.has(c.id));

  async function handleAddCamera() {
    if (!selectedCameraId) return;
    await executeAddCamera({ cameraId: selectedCameraId });
    setSelectedCameraId("");
  }

  async function handleRemoveCamera(cameraId: string) {
    await executeRemoveCamera({ cameraId });
  }

  const addToUserError = getErrorMessage(addToUserResult.error);
  const removeError = getErrorMessage(removeResult.error);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Title2>Your cameras</Title2>
        <Button onClick={logout}>Logout</Button>
      </div>

      {meResult.fetching ? (
        <Spinner label="Loading cameras…" />
      ) : (
        <div>
          {ownedCameras.length === 0 ? (
            <Text>No cameras assigned yet.</Text>
          ) : (
            ownedCameras.map((camera) => (
              <div key={camera.id} className={styles.cameraItem}>
                <div>
                  <Text weight="semibold">{camera.name}</Text>
                  {camera.niceName && <Text> — {camera.niceName}</Text>}
                  <Text block style={{ color: "#666" }}>
                    {camera.address}
                  </Text>
                </div>
                <Button
                  size="small"
                  disabled={removeResult.fetching}
                  onClick={() => handleRemoveCamera(camera.id)}
                  aria-label={`Remove ${camera.name}`}
                >
                  {removeResult.fetching ? "Removing…" : "Remove"}
                </Button>
              </div>
            ))
          )}
          {removeError && (
            <Text role="alert" style={{ color: "red", marginTop: "8px" }} block>
              {removeError}
            </Text>
          )}
        </div>
      )}

      {unassignedCameras.length > 0 && (
        <div className={styles.addSection}>
          <Select
            value={selectedCameraId}
            onChange={(_, data) => setSelectedCameraId(data.value)}
            aria-label="Select a camera to add"
          >
            <option value="">— pick a camera —</option>
            {unassignedCameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.niceName ?? camera.name} ({camera.address})
              </option>
            ))}
          </Select>
          <Button
            appearance="primary"
            disabled={!selectedCameraId || addToUserResult.fetching}
            onClick={handleAddCamera}
          >
            {addToUserResult.fetching ? "Adding…" : "Add"}
          </Button>
        </div>
      )}
      {addToUserError && (
        <Text role="alert" style={{ color: "red", marginTop: "8px" }} block>
          {addToUserError}
        </Text>
      )}

      <CreateCameraForm />
    </div>
  );
}
