import axios from "axios";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { extractGetTweetData, formatGetUserTweetsResponse, formatLatestSearchResponse } from './helpers.js';
import { sleep } from "../../utils/miscUtils.js";

const BASE_URL = "https://twttrapi.p.rapidapi.com"
const API_KEY = process.env.TWITTER_RAPID_API_KEY;

export const UnTwitterApiLimiter = new RateLimiterMemory({
  duration: 2,
  points: 2
})

export const unTwitterApiSearch = async ({
  searchQuery,
  cursor,
  untilUnixTimestamp,
  type = 'latest' // latest | top
}) => {
  try {
    const params = {
      query: searchQuery,
      cursor: cursor
    };

    let allTweets = [];
    let hasMoreTweets = true;

    while (hasMoreTweets) {
      try {
        await UnTwitterApiLimiter.consume(1);
      } catch (error) {
        console.error('Rate limit exceeded for unofficial Twitter API:', error);
        await sleep(error.msBeforeNext);
      }

      // const response = await axios.get(API_URL, { headers, params });

      let endpoint = "/search-latest";
      if (type === 'top') {
        endpoint = "/search-top";
      }

      const response = await axios({
        method: 'GET',
        url: BASE_URL + endpoint,
        // url: BASE_URL + "/search-top",
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'twttrapi.p.rapidapi.com',
          'X-RapidAPI-Key': API_KEY
        },
        params: {
          query: params.query,
          cursor: params.cursor || undefined
        }
      })

      // Get the final link
      const finalUrl = response.request.res.responseUrl;
      console.log('finalUrl', finalUrl);

      // console.log("================================ \n\n")
      // console.log(JSON.stringify(response.data));
      // console.log("================================ \n\n")

      const restructuredData = formatLatestSearchResponse(response.data);

      if (restructuredData.tweets.length === 0) {
        // No more tweets available
        hasMoreTweets = false;
        break;
      }

      allTweets = [...allTweets, ...restructuredData.tweets];

      const lastTweetTimestamp = restructuredData.tweets[restructuredData.tweets.length - 1].tweet.created_at;

      if (untilUnixTimestamp > 0 && lastTweetTimestamp <= untilUnixTimestamp) {
        // Found tweets older than untilUnixTimestamp
        hasMoreTweets = false;
        break;
      }

      // Update cursor for the next API call
      params.cursor = restructuredData.bottomCursor;

      if (!params.cursor) {
        // End of cursor
        hasMoreTweets = false;
        break;
      }

      // Sleep for 1 second to avoid rate limit
      await sleep(1000);
    }

    // Filter tweets that is older than untilUnixTimestamp
    let tweets = allTweets;
    if (untilUnixTimestamp > 0) {
      tweets = tweets.filter(tweet => tweet.tweet.created_at >= untilUnixTimestamp);
    }

    return tweets;
  } catch (error) {
    console.error('Error fetching tweets:', error);
    throw error;
  }
}

export const unTwitterApiGetTweet = async ({
  tweetId
}) => {
  try {
    try {
      await UnTwitterApiLimiter.consume(1);
    } catch (error) {
      console.error('Rate limit exceeded for unofficial Twitter API:', error);
      await sleep(error.msBeforeNext);
    }


    console.log('tweetId', tweetId);
    const response = await axios({
      method: 'GET',
      url: BASE_URL + "/get-tweet",
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Host': 'twttrapi.p.rapidapi.com',
        'X-RapidAPI-Key': API_KEY
      },
      params: {
        tweet_id: tweetId
      }
    })

    const restructuredData = extractGetTweetData(response.data, tweetId);
    return restructuredData;
  } catch (error) {
    console.error('Error fetching tweet:', error);
    throw error;
  }
}

export const unTwitterApiGetUser = async ({
  userId,
  username
}) => {
  try {
    try {
      await UnTwitterApiLimiter.consume(1);
    } catch (error) {
      console.error('Rate limit exceeded for unofficial Twitter API:', error);
      await sleep(error.msBeforeNext);
    }

    let url;
    let params = {};
    if (userId) {
      url = BASE_URL + "/get-user-by-id";
      params = {
        user_id: userId
      }
    } else if (username) {
      url = BASE_URL + "/get-user";
      params = {
        username: username
      }
    } else {
      throw new Error('Missing userId or username');
    }

    const response = await axios({
      method: 'GET',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Host': 'twttrapi.p.rapidapi.com',
        'X-RapidAPI-Key': API_KEY
      },
      params: {
        ...params
      }
    })

    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

export const unTwitterApiGetUserPosts = async ({
  userId,
  username,
  cursor,
  untilUnixTimestamp,
  dontLimitWithTimestamp = false
}) => {
  try {
    try {
      await UnTwitterApiLimiter.consume(1);
    } catch (error) {
      console.error('Rate limit exceeded for unofficial Twitter API:', error);
      await sleep(error.msBeforeNext);
    }

    let allTweets = [];
    let hasMoreTweets = true;

    while (hasMoreTweets) {
      try {
        await UnTwitterApiLimiter.consume(1);
      } catch (error) {
        console.error('Rate limit exceeded for unofficial Twitter API:', error);
        await sleep(error.msBeforeNext);
      }

      let params;
      if (userId) {
        params = {
          user_id: userId,
          cursor: cursor || undefined
        }
      } else if (username) {
        params = {
          username: username,
          cursor: cursor || undefined
        }
      } else {
        throw new Error('Missing userId or username');
      }

      const response = await axios({
        method: 'GET',
        url: BASE_URL + "/user-tweets",
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'twttrapi.p.rapidapi.com',
          'X-RapidAPI-Key': API_KEY
        },
        params: {
          ...params
        }
      })

      const restructuredData = formatGetUserTweetsResponse(response.data);

      console.log('restructuredData', restructuredData);

      if (restructuredData.tweets.length === 0) {
        // No more tweets available
        hasMoreTweets = false;
        break;
      }

      allTweets = [...allTweets, ...restructuredData.tweets];

      const lastTweetTimestamp = restructuredData.tweets[restructuredData.tweets.length - 1].tweet.created_at;

      if (untilUnixTimestamp > 0 && lastTweetTimestamp <= untilUnixTimestamp) {
        // Found tweets older than untilUnixTimestamp
        hasMoreTweets = false;
        break;
      }

      // Update cursor for the next API call
      cursor = restructuredData.bottomCursor;

      if (!cursor) {
        // End of cursor
        hasMoreTweets = false;
        break;
      }

      // Sleep for 1 second to avoid rate limit
      await sleep(1000);
    }

    // Filter tweets that is older than untilUnixTimestamp
    let tweets = allTweets;

    if (dontLimitWithTimestamp === false) {
      if (untilUnixTimestamp > 0) {
        console.log({
          untilUnixTimestamp
        })
        tweets = tweets.filter(tweet => tweet.tweet.created_at >= untilUnixTimestamp);
      }
    }

    // console.log('tweets', tweets);

    return {
      tweets: tweets,
      lastCursor: cursor
    }
  } catch (error) {
    console.error('Error fetching tweets:', error);
    throw error;
  }
}
