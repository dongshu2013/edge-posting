import { twitterProjectHandle } from "@/config";
import { User } from "@prisma/client";
import { Buzz } from "@prisma/client";
import dayjs from "dayjs";

let twitterBearerTokenCache: string | null = null;
let tokenExpirationTime: number | null = null; // Add expiration timestamp

export async function authTwitter() {
  const currentTime = Date.now();

  // Check if token exists and hasn't expired
  if (
    twitterBearerTokenCache &&
    tokenExpirationTime &&
    currentTime < tokenExpirationTime
  ) {
    return twitterBearerTokenCache;
  }

  // Create the basic auth credentials string
  const credentials = `${process.env.TWITTER_API_KEY}:${process.env.TWITTER_API_SECRET}`;

  // Encode to Base64
  const encodedCredentials = btoa(credentials);

  // Create headers with Authorization
  const headers = new Headers({});
  headers.set("Authorization", `Basic ${encodedCredentials}`);

  const formData = new URLSearchParams();
  formData.append("grant_type", "client_credentials");

  const response = await fetch("https://api.x.com/oauth2/token", {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await response.json();
  // console.log("data", data);

  // Set the token and its expiration time (current time + 30 minutes)
  twitterBearerTokenCache = `${data.token_type} ${data.access_token}`;
  tokenExpirationTime = currentTime + 600000; // 10 minutes in milliseconds

  return twitterBearerTokenCache;
}

export async function checkIfUserFollowsTwitter(twitterUsername: string) {
  try {
    const chekcFollowResponse = await fetch(
      `https://api.tweetscout.io/v2/check-follow`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ApiKey: `${process.env.TWEETSCOUT_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          project_handle: twitterProjectHandle,
          user_handle: twitterUsername,
        }),
      }
    );
    const checkFollow = await chekcFollowResponse.json();
    console.log("checkFollow", checkFollow);
    return !!checkFollow?.follow;
  } catch (err) {}
  return false;
}

export async function processUserReplyAttempt(
  id: string,
  buzz: Buzz,
  user: User,
  userRole: string
) {
  console.log(
    "Processing user reply attempt",
    buzz.id,
    buzz.tweetLink,
    user.twitterUsername
  );
  const checkCommentResponse = await fetch(
    `https://api.tweetscout.io/v2/check-comment?tweet_link=${buzz.tweetLink}&user_handle=${user.twitterUsername}`,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ApiKey: `${process.env.TWEETSCOUT_API_KEY}`,
      },
      method: "GET",
    }
  );
  const checkComment = await checkCommentResponse.json();
  if (!checkComment.commented || !checkComment.tweet) {
    await prisma.replyAttempt.update({
      where: {
        id: id,
      },
      data: {
        updatedAt: dayjs().unix(),
        retryCount: {
          increment: 1,
        },
      },
    });
    return;
  }

  // Create the reply with PENDING status
  const reply = await prisma.reply.create({
    data: {
      buzzId: buzz.id,
      replyLink: `https://x.com/games_zawa/status/${checkComment.tweet.id_str}`,
      text: checkComment.tweet.full_text,
      createdBy: user.uid,
      status: "PENDING",
      userRole: userRole,
    },
  });

  // Increment the reply count
  await prisma.buzz.update({
    where: { id: buzz.id },
    data: {
      replyCount: {
        increment: 1,
      },
    },
  });

  await prisma.replyAttempt.delete({
    where: { id: id },
  });
}
