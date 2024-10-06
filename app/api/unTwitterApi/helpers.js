const convertTwitterDateToUnixTimestamp = (dateString) => {
  return Math.floor(new Date(dateString).getTime() / 1000);
};

// Function to extract tweet data
export function extractTweetSearchData(entry) {
  const tweetResult = entry.content.content.tweetResult.result;
  const userResult = tweetResult?.core?.user_result?.result;
  const community = tweetResult?.tweet?.community;

  if (!tweetResult) {
    console.log('entry', entry);
    console.error("Error extracting tweet data:", { tweetResult, userResult });

    if (tweetResult?.reason === 'Suspended') {
      // Delete the tweet from the database
    }

    return null;
  }

  let data;
  if (userResult) {
    // Standard tweet data extraction
    data = {
      tweet: {
        id_str: tweetResult.rest_id,
        created_at: convertTwitterDateToUnixTimestamp(tweetResult.legacy.created_at),
        full_text: tweetResult.legacy.full_text,
        bookmark_count: tweetResult.legacy.bookmark_count !== undefined ? parseInt(tweetResult.legacy.bookmark_count) : null,
        favorite_count: tweetResult.legacy.favorite_count !== undefined ? parseInt(tweetResult.legacy.favorite_count) : null,
        quote_count: tweetResult.legacy.quote_count !== undefined ? parseInt(tweetResult.legacy.quote_count) : null,
        reply_count: tweetResult.legacy.reply_count !== undefined ? parseInt(tweetResult.legacy.reply_count) : null,
        retweet_count: tweetResult.legacy.retweet_count !== undefined ? parseInt(tweetResult.legacy.retweet_count) : null,
        view_count: tweetResult.view_count_info?.count !== undefined ? parseInt(tweetResult.view_count_info.count) : null
      },
      user: {
        id_str: userResult.rest_id,
        name: userResult.legacy.name,
        description: userResult.legacy.description,
        profile_background_color: `#${userResult.legacy.profile_background_color}`,
        profile_image_url_https: userResult.legacy.profile_image_url_https,
        protected: userResult.legacy.protected,
        screen_name: userResult.legacy.screen_name,
        verified: userResult.legacy.verified,
        followers_count: userResult.legacy.followers_count !== undefined ? parseInt(userResult.legacy.followers_count) : null
      }
    };
  } else if (community && community.creator_results) {
    // Community tweet data extraction
    const communityTweet = tweetResult.tweet;

    data = {
      tweet: {
        id_str: communityTweet.rest_id,
        created_at: convertTwitterDateToUnixTimestamp(communityTweet.legacy.created_at),
        full_text: communityTweet.legacy.full_text,
        bookmark_count: communityTweet.legacy.bookmark_count !== undefined ? parseInt(communityTweet.legacy.bookmark_count) : null,
        favorite_count: communityTweet.legacy.favorite_count !== undefined ? parseInt(communityTweet.legacy.favorite_count) : null,
        quote_count: communityTweet.legacy.quote_count !== undefined ? parseInt(communityTweet.legacy.quote_count) : null,
        reply_count: communityTweet.legacy.reply_count !== undefined ? parseInt(communityTweet.legacy.reply_count) : null,
        retweet_count: communityTweet.legacy.retweet_count !== undefined ? parseInt(communityTweet.legacy.retweet_count) : null
      },
      user: {
        id_str: community.creator_results.result.rest_id,
        name: community.creator_results.result.legacy.name,
        description: userResult.creator_results.result.legacy.description,
        profile_background_color: `#${community.creator_results.result.legacy.profile_background_color}`,
        profile_image_url_https: community.creator_results.result.legacy.profile_image_url_https,
        protected: community.creator_results.result.legacy.protected,
        screen_name: community.creator_results.result.legacy.screen_name,
        verified: community.creator_results.result.legacy.verified,
        followers_count: community.creator_results.result.legacy.followers_count !== undefined ? parseInt(community.creator_results.result.legacy.followers_count) : null
      }
    };
  } else {
    console.error("Error extracting tweet data:", { tweetResult, userResult, community });
    return null;
  }

  return data;
}

export function extractGetTweetData(entry, tweetId) {
  const tweetResult = entry?.data?.tweet_result?.result;
  const userResult = tweetResult?.core?.user_result?.result;

  if (!tweetResult) {
    console.log('entry', entry);

    console.error("Error extracting tweet data:", { tweetResult, userResult });
    return null;
  }

  // console.log('description:', userResult?.legacy?.description);

  let data;
  if (userResult) {
    data = {
      tweet: {
        id_str: tweetResult.rest_id,
        created_at: convertTwitterDateToUnixTimestamp(tweetResult.legacy.created_at),
        full_text: tweetResult.legacy.full_text,
        favorite_count: tweetResult.legacy.favorite_count !== undefined ? parseInt(tweetResult.legacy.favorite_count) : null,
        quote_count: tweetResult.legacy.quote_count !== undefined ? parseInt(tweetResult.legacy.quote_count) : null,
        reply_count: tweetResult.legacy.reply_count !== undefined ? parseInt(tweetResult.legacy.reply_count) : null,
        retweet_count: tweetResult.legacy.retweet_count !== undefined ? parseInt(tweetResult.legacy.retweet_count) : null,
        view_count: tweetResult.view_count_info?.count !== undefined ? parseInt(tweetResult.view_count_info.count) : null,
        conversation_id_str: tweetResult.legacy.conversation_id_str,
        in_reply_to_screen_name: tweetResult.legacy.in_reply_to_screen_name,
        in_reply_to_status_id_str: tweetResult.legacy.in_reply_to_status_id_str,
        in_reply_to_user_id_str: tweetResult.legacy.in_reply_to_user_id_str,
        lang: tweetResult.legacy.lang
      },
      user: {
        id_str: userResult.rest_id,
        name: userResult.legacy.name,
        description: userResult.legacy.description,
        profile_background_color: `#${userResult.legacy.profile_background_color}`,
        profile_image_url_https: userResult.legacy.profile_image_url_https,
        protected: userResult.legacy.protected,
        screen_name: userResult.legacy.screen_name,
        verified: userResult.legacy.verified,
        followers_count: userResult.legacy.followers_count !== undefined ? parseInt(userResult.legacy.followers_count) : null,
        friends_count: userResult.legacy.friends_count !== undefined ? parseInt(userResult.legacy.friends_count) : null,
        statuses_count: userResult.legacy.statuses_count !== undefined ? parseInt(userResult.legacy.statuses_count) : null,
        created_at: convertTwitterDateToUnixTimestamp(userResult.legacy.created_at),
        location: userResult.legacy.location
      }
    };
  } else {
    console.log('entry', entry.data);
    console.error("Error extracting tweet data:", { tweetResult, userResult });

    if (tweetResult?.reason === 'Suspended') {
      // Delete the tweet from the database
      try {
        // console.log({
        //   tweetId
        // })
        // prismaQuery.tweet.delete({
        //   where: {
        //     tweetId: tweetId
        //   }
        // });
        // console.log('Deleted tweet from the database');
      } catch (error) {
        console.error('Error deleting tweet from the database:', error);
      }
    }

    return null;
  }

  return data;
}

export function formatLatestSearchResponse(response) {
  try {
    // Extract the timeline instructions
    const instructions = response.data.search.timeline_response.timeline.instructions;

    // Initialize tweets array and cursors
    const tweets = [];
    let topCursor = null;
    let bottomCursor = null;

    // Iterate over instructions to extract data
    instructions.forEach(instruction => {
      if (instruction.__typename === "TimelineAddEntries") {
        // Extract tweets from entries
        instruction.entries.forEach(entry => {
          if (entry.content.__typename === "TimelineTimelineItem" && entry.content.content.__typename === "TimelineTweet") {
            // tweets.push(extractTweetData(entry));
            const extractedTweetData = extractTweetSearchData(entry);
            if (extractedTweetData) {
              tweets.push(extractedTweetData);
            }
          }
          // Extract cursors if present
          if (entry.content.__typename === "TimelineTimelineCursor") {
            if (entry.content.cursorType === "Top") {
              topCursor = entry.content.value;
            } else if (entry.content.cursorType === "Bottom") {
              bottomCursor = entry.content.value;
            }
          }
        });
      } else if (instruction.__typename === "TimelineReplaceEntry") {
        // Extract cursors if present
        const cursor = instruction.entry.content;
        if (cursor.__typename === "TimelineTimelineCursor") {
          if (cursor.cursorType === "Top") {
            topCursor = cursor.value;
          } else if (cursor.cursorType === "Bottom") {
            bottomCursor = cursor.value;
          }
        }
      }
    });

    // Return the restructured data
    return {
      tweets: tweets,
      topCursor: topCursor,
      bottomCursor: bottomCursor
    };
  } catch (error) {
    console.error('Error formatting latest search response:', error);
    return {
      tweets: [],
      topCursor: null,
      bottomCursor: null
    }
  }
}

export function formatGetUserTweetsResponse(response) {
  try {
    // Extract the timeline instructions
    const instructions = response.data.user_result.result.timeline_response.timeline.instructions;

    // Initialize tweets array and cursors
    const tweets = [];
    let topCursor = null;
    let bottomCursor = null;

    // Iterate over instructions to extract data
    instructions.forEach(instruction => {
      if (instruction.__typename === "TimelineAddEntries") {
        // Extract tweets from entries
        instruction.entries.forEach(entry => {
          if (entry.content.__typename === "TimelineTimelineItem" && entry.content.content.__typename === "TimelineTweet") {
            // tweets.push(extractTweetData(entry));
            const extractedTweetData = extractTweetSearchData(entry);
            if (extractedTweetData) {
              tweets.push(extractedTweetData);
            }
          }
          // Extract cursors if present
          if (entry.content.__typename === "TimelineTimelineCursor") {
            if (entry.content.cursorType === "Top") {
              topCursor = entry.content.value;
            } else if (entry.content.cursorType === "Bottom") {
              bottomCursor = entry.content.value;
            }
          }
        });
      } else if (instruction.__typename === "TimelineReplaceEntry") {
        // Extract cursors if present
        const cursor = instruction.entry.content;
        if (cursor.__typename === "TimelineTimelineCursor") {
          if (cursor.cursorType === "Top") {
            topCursor = cursor.value;
          } else if (cursor.cursorType === "Bottom") {
            bottomCursor = cursor.value;
          }
        }
      }
    });

    // Return the restructured data
    return {
      tweets: tweets,
      topCursor: topCursor,
      bottomCursor: bottomCursor
    };
  } catch (error) {
    console.error('Error formatting latest search response:', error);
    return {
      tweets: [],
      topCursor: null,
      bottomCursor: null
    }
  }
}

export function formatGetUserResponse(response) {
  const userResult = response.data.user_result.result;

  if (!userResult) {
    console.error("Error extracting user data:", { userResult });
    return null;
  }

  const userData = {
    id_str: userResult.rest_id,
    name: userResult.legacy.name,
    description: userResult.legacy.description,
    profile_background_color: `#${userResult.legacy.profile_background_color}`,
    profile_image_url_https: userResult.legacy.profile_image_url_https,
    protected: userResult.legacy.protected,
    screen_name: userResult.legacy.screen_name,
    verified: userResult.legacy.verified,
    followers_count: userResult.legacy.followers_count !== undefined ? parseInt(userResult.legacy.followers_count) : null,
    friends_count: userResult.legacy.friends_count !== undefined ? parseInt(userResult.legacy.friends_count) : null,
    statuses_count: userResult.legacy.statuses_count !== undefined ? parseInt(userResult.legacy.statuses_count) : null,
    created_at: convertTwitterDateToUnixTimestamp(userResult.legacy.created_at),
    location: userResult.legacy.location
  };

  return userData;
}