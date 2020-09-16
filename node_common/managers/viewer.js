// TODO(jim): Drop this in the release
import { grpc } from "@improbable-eng/grpc-web";
import { WebsocketTransport } from "@textile/grpc-transport";
grpc.setDefaultTransport(WebsocketTransport());

import * as Utilities from "~/node_common/utilities";
import * as Data from "~/node_common/data";
import * as Constants from "~/node_common/constants";
import * as Serializers from "~/node_common/serializers";

// TODO(jim): Work on better serialization when adoption starts occuring.
export const getById = async ({ id }) => {
  const user = await Data.getUserById({
    id,
  });

  if (!user) {
    return null;
  }

  if (user.error) {
    return null;
  }

  // TODO(jim): You can serialize this last because you will have all the information
  // from subscriptionsed, trusted, and pendingTrusted most likely.
  const activity = await Data.getActivityForUserId({ userId: id });
  const slates = await Data.getSlatesByUserId({ userId: id });
  const keys = await Data.getAPIKeysByUserId({ userId: id });
  const subscriptions = await Data.getSubscriptionsByUserId({ userId: id });
  const subscribers = await Data.getSubscribersByUserId({ userId: id });

  let serializedUsersMap = { [user.id]: Serializers.user(user) };
  let serializedSlatesMap = {};

  // NOTE(jim): The most expensive call first.
  const r1 = await Serializers.doSubscriptions({
    users: [],
    slates: [],
    subscriptions,
    serializedUsersMap,
    serializedSlatesMap,
  });

  const r2 = await Serializers.doSubscribers({
    users: [],
    slates: [],
    subscribers,
    serializedUsersMap: r1.serializedUsersMap,
    serializedSlatesMap: r1.serializedSlatesMap,
  });

  // NOTE(jim): If any trusted users are subscription users, this ends up being cheaper.
  const trusted = await Data.getTrustedRelationshipsByUserId({ userId: id });
  const r3 = await Serializers.doTrusted({
    users: [],
    trusted,
    serializedUsersMap: r2.serializedUsersMap,
    serializedSlatesMap: r2.serializedSlatesMap,
  });

  // NOTE(jim): This should be the cheapest call.
  const pendingTrusted = await Data.getPendingTrustedRelationshipsByUserId({
    userId: id,
  });
  const r4 = await Serializers.doPendingTrusted({
    users: [id],
    pendingTrusted,
    serializedUsersMap: r3.serializedUsersMap,
    serializedSlatesMap: r3.serializedSlatesMap,
  });

  let bytes = 0;
  user.data.library[0].children.forEach((each) => {
    bytes = each.size + bytes;
  });

  return {
    ...Serializers.user(user),
    type: "VIEWER",
    library: user.data.library,

    // NOTE(jim): Remaining data.
    stats: {
      bytes,
      maximumBytes: Constants.TEXTILE_ACCOUNT_BYTE_LIMIT,
    },
    keys,
    activity,
    slates,
    subscriptions: r1.serializedSubscriptions,
    subscribers: r2.serializedSubscribers,
    trusted: r3.serializedTrusted,
    pendingTrusted: r4.serializedPendingTrusted,
  };
};

export const getTextileById = async ({ id }) => {
  const user = await Data.getUserById({
    id,
  });

  if (!user) {
    return null;
  }

  if (user.error) {
    return null;
  }

  let info = {};
  let status = {};
  let errors = [];
  let jobs = [];

  const {
    buckets,
    bucketKey,
    bucketName,
    bucketRoot,
  } = await Utilities.getBucketAPIFromUserToken(user.data.tokens.api);

  const {
    power,
    powerInfo,
    powerHealth,
  } = await Utilities.getPowergateAPIFromUserToken(user.data.tokens.api);

  try {
    info = await buckets.archiveInfo(bucketRoot.root.key);
  } catch (e) {
    errors.push({ decorator: "INFO", message: e.message, code: e.code });
  }

  try {
    status = await buckets.archiveStatus(bucketRoot.root.key);
  } catch (e) {
    errors.push({ decorator: "STATUS", message: e.message, code: e.code });
  }

  try {
    buckets.archiveWatch(bucketRoot.root.key, (job) => {
      if (!job) {
        return;
      }

      job.id = job.id ? job.id : "UNDEFINED";
      jobs.push(job);
    });
  } catch (e) {
    errors.push({ decorator: "JOB", message: e.message, code: e.code });
  }

  return {
    type: "VIEWER_FILECOIN",
    settings: {
      deals_auto_approve: user.data.settings_deals_auto_approve,
    },
    powerInfo,
    powerHealth,
    archive: {
      info,
      status,
      errors,
      jobs,
    },
  };
};
