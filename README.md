# threepeaks-spotify
Spotify playlist collaboration through Slack.

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

Create a Slash Command, such as `/music`, which accepts a search term, which can be a keyword or artist and track name for a more specific search:

    /music Rick Astley - Never Gonna Give You Up

##Installation

###Slack

Create the Slash Command: [Slash Commands page](https://my.slack.com/services/new/slash-commands).

During setup, configure the command to submit a POST to the app's `/store` endpoint, e.g. `https://app-name.herokuapp.com/store`.

Make a note of the `token`, as we'll need it later.

###Spotify

Go to [Spotify's Developer Site](http://developer.spotify.com) and create a new Application. Add the callback URI, e.g for Heroku `https://app-name.herokuapp.com/callback`

Make a note of the `Client ID`, `Client Secret` and `Callback URI`.

Create a target playlist and find the `playlist identifier`. In the app, right-click the playlist to get it's URI; we'll need the last segment of the URI.

###Environment Variables

After deploying with Heroku, the following environment variables will need to be setup. These can either be stored in a `.env` or set up as config variables in Heroku.

* `SLACK_TOKEN` - The token from Slack's Slash Command.
* `SPOTIFY_KEY` - Spotify application key (a.k.a Client ID).
* `SPOTIFY_SECRET` - Spotify application secret (a.k.a Client Secret).
* `SPOTIFY_USERNAME` - Your Spotify username.
* `SPOTIFY_PLAYLIST_ID` - The playlist identifier.
* `SPOTIFY_REDIRECT_URI` - URI to redirect to once your user has allowed the application's permissions.

###Authentication

Visit the deployed app's home page to authenticate yourself with Spotify.
