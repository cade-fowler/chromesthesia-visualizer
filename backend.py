import pymongo, requests, random, string, spotipy
from spotipy.oauth2 import SpotifyOAuth

scope = "user-read-currently-playing"
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope, client_id='REDACTED', client_secret='REDACTED', redirect_uri='http://localhost:8888/callback'))

ENTRIES_TO_REMOVE = (
    'available_markets',
    'disc_number', 
    'duration_ms', 
    'explicit', 
    'external_ids',
    'href',
    'is_local',
    'uri',
    'type',
    'track_number',
    'preview_url'
)

ALBUM_ENTRIES_TO_REMOVE = (
    'href',
    'available_markets',
    'id',
    'uri',
    'images',
    'release_date_precision',
    'total_tracks',
    'artists',
    'type'
)

ARTISTS_ENTRIES_TO_REMOVE = (
    'href',
    'uri'
)

myclient = pymongo.MongoClient("mongodb://localhost:27017/")
colordb = myclient["colordatabase"]
songs = colordb["songs"]

song1 = { "name": "xx", "artist": "", "colors": ["red", "blue"]}

def insert_song(song):
    pass
    # songs.update_one(song, {$push: {colors: song.colors} }, {upsert: true})

def insert_color(color):
    pass

def get_song_colors(song_name):
    colors = songs.find({"name": song_name}, {"colors": 1})
    for y in colors:
        print(y)

def get_song():
    song_id = sp.currently_playing()['item']['id']
    song = sp.track(song_id)
    [song.pop(key) for key in ENTRIES_TO_REMOVE]
    [song['album'].pop(key) for key in ALBUM_ENTRIES_TO_REMOVE]
    for artist in song['artists']:
        [artist.pop(key) for key in ARTISTS_ENTRIES_TO_REMOVE]
    return song

print(get_song())




