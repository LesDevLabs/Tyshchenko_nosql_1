const spotify = db.getSiblingDB("spotify");


const q1 = { track_genre: "pop", "audio_features.danceability": { $gte: 0.7 } };
printjson(
	spotify.tracks
		.find(q1)
		.sort({ popularity: -1 })
		.limit(5)
		.explain("executionStats")
);

spotify.tracks.createIndex({ track_genre: 1, "audio_features.danceability": 1, popularity: -1 });

print("\n#1 AFTER index");
printjson(
	spotify.tracks
		.find(q1)
		.sort({ popularity: -1 })
		.limit(5)
		.explain("executionStats")
);


spotify.tracks.createIndex({
	"audio_features.instrumentalness": 1,
	"audio_features.speechiness": 1,
	explicit: 1,
});

const q2 = {
	"audio_features.loudness": { $lt: -10 },
	"audio_features.speechiness": { $lt: 0.1 },
	"audio_features.instrumentalness": { $gt: 0.5 },
	explicit: false,
};

printjson(spotify.tracks.find(q2).limit(5).explain("executionStats"));

const q3 = { track_genre: "pop", popularity: { $gte: 70 } };
printjson(
	spotify.tracks
		.find(q3, { projection: { _id: 0, track_genre: 1, popularity: 1 } })
		.explain("executionStats")
);