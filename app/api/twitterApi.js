import axios from "axios";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

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
