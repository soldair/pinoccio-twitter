var pinoccio = require('pinoccio'),
  twitter = require('twit');

/*
var opts = {
  token:"",
  troop:1,
  scout:1,
  twitter:{
    consumer_key:         'asdf',
    consumer_secret:      'asdf',
    access_token:         'asdf',
    access_token_secret:  'adsf'
  }
}
*/


module.exports = function(options,match){

  var obj = new require('events').EventEmitter;


  // Pinoccio API
  var pinoccioAPI = pinoccio(options.pinoccio||options.token);
  // default command options
  var commandOptions = {scout:options.scout,troop:options.troop};
  // Twitter API
  var twitterAPI = new twit(options.twitter);
  // Open the tweet stream, and act on incoming tweets
  var tweetStream = twitter.stream('user');

  // expose the things,
  obj.match = match;
  obj.pinoccioAPI = pinoccioAPI;
  obj.options = options;
  obj.twitterAPI = twitterAPI;
  obj.tweetStream = tweetStream;

  tweetStream.on('tweet', function(tweet){
    
    // change links back into their original text
    _.each(tweet.entities.urls, function(url){
      tweet.text = tweet.text.replace(url.url, url.display_url);
    });

    obj.emit('log','got tweet `'+tweet.text+'` from @'+tweet.user.screen_name);

    obj.match(tweet.text,function(err,data){
      if(err) return; // if error assume invalid tweet
      if(!data) return;// if data is false assume handled
      
      if(typeof data == 'string') data.command = data;
      if(!data.command) return console.log('should call back with a command');
      
      copts = ext({},commandOptions);
      data = ext(copts,data);// make sure data params override but dont erase defaults


      obj.emit('log','got command `'+data.command+'` from @'+tweet.user.screen_name);

      // send the command to the scout
      pinoccioAPI.rest({url:'/v1/'+data.troop+'/'+data.scout+'/command', method:'post', data:{command: data.command}}, function(err, res){
        if (res) {
          var reply = res.reply.trim();
          if (reply === '') reply = '✔';
          reply = '@'+tweet.user.screen_name+' '+reply;
          twitter.post('statuses/update', {status: reply, in_reply_to_status_id:tweet.id}, function(err, data, res){
            console.log(err || 'replied with "'+reply+'"');
          })
        };
      });      
      
    })
  });

  return obj;
}

function ext(o1,o2){
  Object.keys(o2).forEach(function(v,k){ o1[k] = v; })
  return o1;
}
