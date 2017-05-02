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

 
exports.helloGCS = function helloGCS (event, callback) {
  const file = event.data;

  /**
   * Types (extensions) that we supported - for now
   * @type {Array}
   */
  const supportTypes = ['mp3', 'm4a', 'ogg' , 'MP3' , 'M4A' , 'OGG' , 'mP3' , 'Mp3'];

  const bucket = file.bucket;
  console.log(`Bucket name is ${file.bucket}.`);
  const key = decodeURIComponent(file.name.replace(/\+/g, ' '));
  console.log(`File name is ${key}.`);
  
  // Check the media type.
  const typeMatch = key.match(/\.([^.]*)$/);
  if (!typeMatch) {
	  console.log(`Could not determine the media type.`);
  	return;
  }
  
  const type = typeMatch[1];
  if (supportTypes.indexOf(type) === -1) {
	  console.log(`Unsupported media type: ${type}`);
  	return;
  }  
	  
  if (file.resourceState === 'not_exists') {
    console.log(`File ${file.name} deleted.`);
	return handleDelete(file.bucket, file.name, callback);
  } else if (file.timeCreated === file.updated) {
	  console.log(`File ${file.name} uploaded.`);
	return handlePut(file.bucket, file.name, callback);
  }	else {
	  console.log(`File changed but this is not supported yet.`);
  }
  callback();
};


/**
 * Download the new/modified file from S3, read its tags, and post to Koel.
 * @param  {string}   bucket The bucket name
 * @param  {string}   key    The object key
 * @param  {Function} cb
 * @return {[type]}          [description]
 */
function handlePut(bucket, key, callback) {
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
		destination: fileName
	};

	async.waterfall([
		function fetch(next) {
			
			file.download(function(err, contents) { 
				if (err) {
					console.log(`Failed to fetch object from Google Cloud Storage: ${err}`);
					return callback();
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
		
		console.log(`Successfull`);
		callback();
	});
}

/**
 * Delete a song from Koel.
 * @param  {string}   bucket The bucket name
 * @param  {string}   key    The object key
 * @param  {Function} cb
 */
function handleDelete(bucket, key, callback ) {
	request.delete({
		url: `${process.env.KOEL_HOST}/api/os/s3/song`,
		form: {
			bucket,
			key,
			appKey: process.env.KOEL_APP_KEY
		}
	}, err => {
		if (err) {
			console.log(`Error deleting song from Koel: ${err}.`);
		} else {
			console.log(`Successfully removed file ${key} from Koel.`);
			callback();
		}
	});
}
