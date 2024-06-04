import pymongo

myclient = pymongo.MongoClient("mongodb://localhost:27017/")
colordb = myclient["colordatabase"]
songs = colordb["songs"]

song1 = { "name": "xx", "artist": "", "colors": ["red", "blue"]}

x = songs.insert_one(song1)
print(x.inserted_id)

def get_song_info():
    pass

def input_color(color):
    pass

def get_song_colors(song_name):
    colors = songs.find({"name": song_name}, {"colors": 1})

get_song_colors("xx")


