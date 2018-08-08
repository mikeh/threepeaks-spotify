// Package dependencies
var express       = require('express');
var bodyParser    = require('body-parser');
var dotenv        = require('dotenv');
var spotifyWebApi = require('spotify-web-api-node');

// Node dependencies
var fs            = require('fs');

dotenv.load();

var spotify = new spotifyWebApi({
  clientId     : process.env.SPOTIFY_KEY,
  clientSecret : process.env.SPOTIFY_SECRET,
  redirectUri  : process.env.SPOTIFY_REDIRECT_URI
});

var slack = require('slack-notify')(process.env.SLACK_URL);

var playlistFetcherActive = false;

var fetchPlaylist = function() {
  var lastDate = new Date(fs.readFileSync('./last_date.txt').toString() );

  var updateLastDate = function(date) {
    fs.writeFile("./last_date.txt", date, function() {});
  };

  return function() {
    if (!playlistFetcherActive) { return; }

    console.log("Last fetched at:", lastDate);
    spotifyApi.getPlaylist(spotifyUser, spotifyPlaylistId, {fields: 'tracks.items(added_by.id,added_at,track(name,artists.name,album.name)),name,external_urls.spotify'})
      .then(function(data) {
        for (var i in data.tracks.items) {
          var playlistEntry = data.tracks.items[i];
          var date = new Date(playlistEntry.added_at);
          if((lastDate === undefined) || (date > lastDate)) {
            post(data.name, 
              data.external_urls.spotify, 
              playlistEntry.added_by ? playlistEntry.added_by.id : "Unknown",
              playlistEntry.track.name,
              playlistEntry.track.artists);
            lastDate = new Date(playlistEntry.added_at);
            updateLastDate(lastDate);
          }
        }
      }, function(err) {
        console.log('Something went wrong! ', err);
      });
  };
};


var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', function(req, res) {
  if (spotify.getAccessToken()) {
    playlistFetcherActive = true;
    return res.send('You are logged in to Spotify.');
  }
  return res.send('<a href="/authorise">Authorise</a>');
});

app.get('/authorise', function(req, res) {
  var scopes = ['playlist-modify-public', 'playlist-modify-private'];
  var state  = new Date().getTime();
  var authoriseURL = spotify.createAuthorizeURL(scopes, state);
  res.redirect(authoriseURL);
});

app.get('/callback', function(req, res) {
  spotify.authorizationCodeGrant(req.query.code)
    .then(function(data) {
      spotify.setAccessToken(data.body['access_token']);
      spotify.setRefreshToken(data.body['refresh_token']);
      return res.redirect('/');
    }, function(err) {
      return res.send(err);
    });
});

app.use('/store', function(req, res, next) {
  if (req.body.token !== process.env.SLACK_TOKEN) {
    return res.status(400).send('Missing token');
  }
  next();
});

app.post('/store', function(req, res) {
  spotify.refreshAccessToken()
    .then(function(data) {
      spotify.searchTracks(req.body.text)
        .then(function(data) {
          var results = data.body.tracks.items;
          if (results.length === 0) {
            return res.send('Could not find that track. Maybe try adding the artist or iusing a more specific search phrase?');
          }
          var track = results[0];
          var trackId = track.id;
          spotify.addTracksToPlaylist(process.env.SPOTIFY_USERNAME, process.env.SPOTIFY_PLAYLIST_ID, ['spotify:track:' + trackId])
            .then(function(data) {
              var artistNames = [];
              for (var i in track.artists) {
                artistNames.push(track.artists[i].name);
              }
              return res.send('"' + artistNames.join(',') + ' - ' + track.name + '" was added.');
            }, function(err) {
              console.log(err.message);
              return res.send(err.message);
            });
        }, function(err) {
          console.log(err.message);
          return res.send(err.message);
        });
    }, function(err) {
      return res.send('Could not refresh access token. Go and kick @mike');
    });
});

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));
