import axios from "axios";
import { RateLimiterMemory } from "rate-limiter-flexible";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_RAPID_API_KEY = process.env.TWITTER_RAPID_API_KEY;

const BASE_URL = "https://twttrapi.p.rapidapi.com";

export const UnTwitterApiLimiter = new RateLimiterMemory({
  duration: 2,
  points: 8,
});

export const authorizeTwitter = async ({ code, redirectUri, codeVerifier }) => {
  const clientCredentials = Buffer.from(
    `${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`
  ).toString("base64");

  try {
    const response = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${clientCredentials}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error exchanging authorization code for token:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getTwitterUser = async ({ accessToken }) => {
  try {
    const response = await axios.get("https://api.x.com/2/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error exchanging authorization code for token:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const unTwitterApiGetUser = async ({ userId }) => {
  try {
    try {
      await UnTwitterApiLimiter.consume(1);
    } catch (error) {
      console.error("Rate limit exceeded for unofficial Twitter API:", error);
    }

    const response = await axios({
      method: "GET",
      url: BASE_URL + "/get-user-by-id",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Host": "twttrapi.p.rapidapi.com",
        "X-RapidAPI-Key": TWITTER_RAPID_API_KEY,
      },
      params: {
        user_id: userId,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};
