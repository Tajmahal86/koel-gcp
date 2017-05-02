/**
 * Background Cloud Function to be triggered by Cloud Storage.
 *
 * @param {object} event The Cloud Functions event.
 * @param {function} The callback function.
 */
 
 
require('dotenv').config();
const mm = require('musicmetadata');
const async = require('async');
const request = require('request');
const fs = require('fs');
const util = require('util')
const storage = require('@google-cloud/storage');



    const bucket = 'koel';
	const key = 'Mezdeke - Darbuka Show.mp3';

	'use strict';

	let tags = {};
	let lyrics = ''; // Lyrics is handled differently

	const projectId = process.env.GCP_PROJECTID;

	const gcs = storage({
	  projectId: projectId
	});

	const file = gcs.bucket(bucket).file(key);

	const fileName = `/tmp/${Math.random().toString(36)}`;
	const options = {
    // The path to which the file should be downloaded, e.g. "./file.txt"
		destination: fileName
	};


	async.waterfall([
		function fetch(next) {

			file.download(function(err, contents) { 
				if (err) {
					console.log(`Failed to fetch object from Google Cloud Storage: ${err}`);
					return;
					//return callback(`Failed to fetch object from Google Cloud Storage: ${err}`);
				}
				
				fs.writeFileSync(fileName, contents);
				console.log(`File ${file.name} downloaded to ${fileName}`);
				const parser = mm(fs.createReadStream(fileName), {duration: true}, (err, rawTags) => {
					if (err) {
						console.error(`Error reading tags: ${err}.`);
						return;
					}

					tags = rawTags;
					next();
				});

				parser.on('ULT', result => {
					lyrics = result.text;
				});
			});		
		},

		/**
		 * Format the tags into something Koel can handle.
		 * @param  {Function} next
		 */
		function formatTags(next) {
			console.error(`Formatting Tags`);
			tags.lyrics = lyrics;
			tags.artist = tags.artist.length ? tags.artist[0] : '';
			tags.albumartist = tags.albumartist.length ? tags.albumartist[0] : '';
			tags.track = tags.track.no;

			if (tags.picture.length) {
				tags.cover = {
					extension: tags.picture[0].format,
					data: tags.picture[0].data.toString('base64')
				};
			}
			delete tags.picture;

			next();
		},

		function postToKoel() {
			console.error(`Posting To Koel`);
			request.post({
				url: `${process.env.KOEL_HOST}/api/os/s3/song`,
				form: {
					bucket,
					key,
					tags,
					appKey: process.env.KOEL_APP_KEY
				}
			}, err => {
				if (err) {
					console.log(`Error posting to Koel: ${err}.`);
				}
			});
		}
	], function (err) {
		if (err) {
			console.error(`Error: ${err}.`);
		} else {
			console.log(`Successfully sync ${key}`);
		}

		callback(null, 'Successful.');
	});

