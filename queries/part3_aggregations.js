const spotify = db.getSiblingDB("spotify");


const topArtists = spotify.tracks
    .aggregate([
        { $unwind: "$artists" },
        {
            $group: {
                _id: "$artists",
                tracks_count: { $sum: 1 },
                avg_popularity: { $avg: "$popularity" },
            },
        },
        { $match: { tracks_count: { $gte: 5 } } },
        {
            $project: {
                _id: 0,
                artist: "$_id",
                tracks_count: 1,
                avg_popularity: { $round: ["$avg_popularity", 1] },
            },
        },
        { $sort: { avg_popularity: -1 } },
        { $limit: 10 },
    ])
    .toArray();
printjson(topArtists);


const moodStats = spotify.tracks
    .aggregate([
        {
            $addFields: {
                mood: {
                    $switch: {
                        branches: [
                            {
                                case: {
                                    $and: [
                                        { $gte: ["$audio_features.valence", 0.5] },
                                        { $gte: ["$audio_features.energy", 0.5] },
                                    ],
                                },
                                then: "happy",
                            },
                            {
                                case: {
                                    $and: [
                                        { $lt: ["$audio_features.valence", 0.5] },
                                        { $gte: ["$audio_features.energy", 0.5] },
                                    ],
                                },
                                then: "angry",
                            },
                            {
                                case: {
                                    $and: [
                                        { $gte: ["$audio_features.valence", 0.5] },
                                        { $lt: ["$audio_features.energy", 0.5] },
                                    ],
                                },
                                then: "calm",
                            },
                            {
                                case: {
                                    $and: [
                                        { $lt: ["$audio_features.valence", 0.5] },
                                        { $lt: ["$audio_features.energy", 0.5] },
                                    ],
                                },
                                then: "sad",
                            },
                        ],
                        default: "unknown",
                    },
                },
            },
        },
        { $group: { _id: "$mood", count: { $sum: 1 } } },
        { $project: { _id: 0, mood: "$_id", count: 1 } },
        { $sort: { count: -1 } },
    ])
    .toArray();
printjson(moodStats);


const danceGenres = spotify.tracks
    .aggregate([
        {
            $group: {
                _id: "$track_genre",
                count: { $sum: 1 },
                avg_danceability: { $avg: "$audio_features.danceability" },
                avg_energy: { $avg: "$audio_features.energy" },
                avg_valence: { $avg: "$audio_features.valence" },
            },
        },
        { $match: { count: { $gte: 100 } } },
        {
            $project: {
                _id: 0,
                genre: "$_id",
                count: 1,
                avg_danceability: { $round: ["$avg_danceability", 3] },
                avg_energy: { $round: ["$avg_energy", 3] },
                avg_valence: { $round: ["$avg_valence", 3] },
            },
        },
        { $sort: { avg_danceability: -1 } },
        { $limit: 10 },
    ])
    .toArray();
printjson(danceGenres);