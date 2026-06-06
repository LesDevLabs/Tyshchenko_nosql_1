const spotify = db.getSiblingDB("spotify");


printjson(
    spotify.tracks
        .find(
            {
                "audio_features.danceability": { $gt: 0.7 },
                "audio_features.energy": { $gt: 0.7 },
                duration_ms: { $gte: 180000, $lte: 300000 },
            },
            {
                projection: {
                    track_name: 1,
                    artists: 1,
                    duration_ms: 1,
                    "audio_features.danceability": 1,
                    "audio_features.energy": 1,
                    popularity: 1,
                    track_genre: 1,
                },
            }
        )
        .sort({ popularity: -1 })
        .limit(20)
        .toArray()
);


printjson(
    spotify.tracks
        .aggregate([
            { $unwind: "$artists" },
            {
                $group: {
                    _id: "$artists",
                    tracks_count: { $sum: 1 },
                    min_popularity: { $min: "$popularity" },
                    avg_popularity: { $avg: "$popularity" },
                },
            },
            { $match: { tracks_count: { $gte: 3 }, min_popularity: { $gte: 60 } } },
            {
                $project: {
                    _id: 0,
                    artist: "$_id",
                    tracks_count: 1,
                    min_popularity: 1,
                    avg_popularity: { $round: ["$avg_popularity", 1] },
                },
            },
            { $sort: { tracks_count: -1, avg_popularity: -1 } },
            { $limit: 20 },
        ])
        .toArray()
);

printjson(
    spotify.tracks
        .aggregate([
            {
                $group: {
                    _id: "$track_genre",
                    avg_tempo: { $avg: "$audio_features.tempo" },
                    std_tempo: { $stdDevPop: "$audio_features.tempo" },
                },
            },
            {
                $addFields: {
                    genre: "$_id",
                    avg_tempo: { $round: ["$avg_tempo", 1] },
                    outlier_threshold: {
                        $round: [
                            { $add: ["$avg_tempo", { $multiply: [2, "$std_tempo"] }] },
                            1,
                        ],
                    },
                },
            },
            { $unset: "_id" },
            {
                $lookup: {
                    from: "tracks",
                    localField: "genre",
                    foreignField: "track_genre",
                    as: "all_tracks",
                },
            },
            { $unwind: "$all_tracks" },
            {
                $match: {
                    $expr: {
                        $gt: ["$all_tracks.audio_features.tempo", "$outlier_threshold"],
                    },
                },
            },
            {
                $group: {
                    _id: "$genre",
                    avg_tempo: { $first: "$avg_tempo" },
                    outlier_threshold: { $first: "$outlier_threshold" },
                    outlier_tracks: {
                        $push: {
                            _id: "$all_tracks._id",
                            track_name: "$all_tracks.track_name",
                            popularity: "$all_tracks.popularity",
                            artists: "$all_tracks.artists",
                            audio_features: { tempo: "$all_tracks.audio_features.tempo" },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    genre: "$_id",
                    avg_tempo: 1,
                    outlier_threshold: 1,
                    outlier_tracks: { $slice: ["$outlier_tracks", 10] },
                },
            },
            { $sort: { outlier_threshold: -1 } },
            { $limit: 20 },
        ])
        .toArray()
);

printjson(
    spotify.tracks
        .find(
            {
                "audio_features.loudness": { $lt: -10 },
                "audio_features.speechiness": { $lt: 0.1 },
                "audio_features.instrumentalness": { $gt: 0.5 },
                explicit: false,
            },
            {
                projection: {
                    track_name: 1,
                    artists: 1,
                    popularity: 1,
                    "audio_features.loudness": 1,
                    "audio_features.speechiness": 1,
                    "audio_features.instrumentalness": 1,
                    track_genre: 1,
                },
            }
        )
        .sort({ popularity: -1 })
        .limit(20)
        .toArray()
);
