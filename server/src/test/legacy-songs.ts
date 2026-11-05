// Real documents from the pre-migration database (backup of 2026-11-05):
// two raw-Spotify-shaped songs from 2024, a song-level note, uppercase colors
// and an artist with a leading space.
import { ObjectId } from 'mongodb';

export const legacySongs = [
    {
        _id: new ObjectId('665ec2b315dc2b43dccdc176'),
        album: {
            album_type: 'album',
            external_urls: {
                spotify: 'https://open.spotify.com/album/0bUTHlWbkSQysoM3VsWldT',
            },
            name: 'Demon Days',
            release_date: '2005-05-23',
        },
        artists: [
            {
                external_urls: {
                    spotify: 'https://open.spotify.com/artist/3AA28KZvwAUcZuOKwyblJQ',
                },
                id: '3AA28KZvwAUcZuOKwyblJQ',
                name: 'Gorillaz',
                type: 'artist',
            },
        ],
        external_urls: {
            spotify: 'https://open.spotify.com/track/0d28khcov6AiegSCpG5TuT',
        },
        id: '0d28khcov6AiegSCpG5TuT',
        name: 'Feel Good Inc.',
        popularity: 84,
        colors: ['#001122', '#00FFFF', '#105070', '#691738'],
    },
    {
        _id: new ObjectId('665ec2e88a2cb5ac35c2ae14'),
        album: {
            album_type: 'album',
            external_urls: {
                spotify: 'https://open.spotify.com/album/3yoNZlqerJnsnMN5EDwwBS',
            },
            name: 'Strange Trails',
            release_date: '2015-04-07',
        },
        artists: [
            {
                external_urls: {
                    spotify: 'https://open.spotify.com/artist/6ltzsmQQbmdoHHbLZ4ZN25',
                },
                id: '6ltzsmQQbmdoHHbLZ4ZN25',
                name: 'Lord Huron',
                type: 'artist',
            },
        ],
        external_urls: {
            spotify: 'https://open.spotify.com/track/0QZ5yyl6B6utIWkxeBDxQN',
        },
        id: '0QZ5yyl6B6utIWkxeBDxQN',
        name: 'The Night We Met',
        popularity: 79,
        colors: ['#00FFFF'],
    },
    {
        _id: new ObjectId('680f13cb85af2c2ed1750269'),
        albumImageUrl: 'https://i.scdn.co/image/ab67616d0000b27365a472d8326d4571bf725422',
        songUrl: 'https://open.spotify.com/track/1dHtMSJ1Ozg2Ja6GX4McAO',
        title: 'Paul Revere',
        id: '1dHtMSJ1Ozg2Ja6GX4McAO',
        artists: ['Noah Kahan'],
        colors: ['#4c1767', '#111012'],
        notes: ['Glossy'],
    },
    {
        _id: new ObjectId('680ec94a1fd4d4d2dd498b20'),
        albumImageUrl: 'https://i.scdn.co/image/ab67616d0000b27307989cd8699c9aaa2c232d08',
        songUrl: 'https://open.spotify.com/track/2kXjRzwcTZhGLnVjUud8l3',
        title: 'Little Lion Man',
        id: '2kXjRzwcTZhGLnVjUud8l3',
        artists: ['Mumford & Sons'],
        colors: [
            '#FFFFFF',
            '#f4f4f4',
            '#d4d4d4',
            '#bcbcbc',
            '#a2a2a2',
            '#868686',
            '#717171',
            '#5b5b5b',
        ],
    },
    {
        _id: new ObjectId('680c5acf1fd4d4d2dd498b1f'),
        albumImageUrl: 'https://i.scdn.co/image/ab67616d0000b273ab3b105e28a0d26df5be8d16',
        songUrl: 'https://open.spotify.com/track/54eZmuggBFJbV7k248bTTt',
        title: 'A Horse with No Name',
        id: '54eZmuggBFJbV7k248bTTt',
        artists: ['America', ' George Martin'],
        colors: ['#cba058'],
    },
];
