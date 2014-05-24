var express = require('express'),
    pinoccio = require('pinoccio'),
    twitter = require('twit');

var app = express();

// Pinoccio API
var pinoccioAPI = pinoccio("asdf");

// Twitter API
var twitterAPI = new twit({
  consumer_key:         'asdf',
  consumer_secret:      'asdf',
  access_token:         'asdf',
  access_token_secret:  'adsf'
});

// Open the tweet stream, and act on incoming tweets
var tweetStream = twitter.stream('user');

tweetStream.on('tweet', function(tweet){
  
  // change links back into their original text
  _.each(tweet.entities.urls, function(url){
    tweet.text = tweet.text.replace(url.url, url.display_url);
  });

  // If this was a command tweet to our Scout
  var match = /^@gopinoccio\b.*>(.+)/gi.exec(tweet.text);

  if (match) {

    var command = match[1];
    console.log('got command `'+command+'` from @'+tweet.user.screen_name);

    // send the command to the scout
    pinoccioAPI.rest({url:'/v1/27/2/command', method:'post', data:{command: command}}, function(err, res){
      if (res) {
        var reply = res.reply.trim();
        if (reply === '') reply = '✔';
        reply = '@'+tweet.user.screen_name+' '+reply;
        twitter.post('statuses/update', {status: reply, in_reply_to_status_id:tweet.id}, function(err, data, res){
          console.log(err || 'replied with "'+reply+'"');
        })
      };
    });
  };
})

// start it up!
app.listen(3000);
