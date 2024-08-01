import React from "react";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import store from "../store";
import { addFeed } from "../store/reducers/configuration";

export const NOTIFICATION_FETCH_TASK = "refresh-feeds-on-notification";

export const onNotification = (data: any) => {
  console.log("onNotification", data);
  const { refresh = null } = data;

  if (refresh === true) {
    const urls = Object.keys(store.getState().configuration.feeds || {});

    (async (urls) => {
      for (let url of urls) {
        try {
          await store.dispatch(addFeed(url)).unwrap();
          console.log(url, "refreshed");
        } catch (e) {
          console.log(url, "error", e);
        }
      }
    })(urls);
  }
};

TaskManager.defineTask(
  NOTIFICATION_FETCH_TASK,
  ({ data, error, executionInfo }) => {
    onNotification(data);
  }
);

export const BACKGROUND_FETCH_TASK = "refresh-feeds";

// 1. Define the task by providing a name and the function that should be executed
// Note: This needs to be called in the global scope (e.g outside of your React components)
TaskManager.defineTask(BACKGROUND_FETCH_TASK, () => {
  onNotification({ refresh: true });

  console.log(`Background fetch triggered: ${new Date().toISOString()}`);

  // Be sure to return the successful result type!
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

// 2. Register the task at some point in your app by providing the same name,
// and some configuration options for how the background fetch should behave
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
export async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: __DEV__ ? 10 : 60 * 5, // 5 minutes
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  });
}

// 3. (Optional) Unregister tasks by specifying the task name
// This will cancel any future background fetch calls that match the given name
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
export async function unregisterBackgroundFetchAsync() {
  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}

export function useStatus() {
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [status, setStatus] =
    React.useState<BackgroundFetch.BackgroundFetchStatus>(null);

  const checkStatusAsync = async () => {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK
    );
    setStatus(status);
    setIsRegistered(isRegistered);
  };

  checkStatusAsync();

  return React.useMemo(
    () => ({
      status,
      isRegistered,
      checkStatusAsync,
    }),
    [status, isRegistered]
  );
}
