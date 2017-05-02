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



	'use strict';

	let tags = {};
	let lyrics = ''; // Lyrics is handled differently



// Your Google Cloud Platform project ID
const projectId = 'rahwane-farm';

// Instantiates a client
const gcs = storage({
  projectId: projectId
});


  // References an existing bucket, e.g. "my-bucket"
  // const bucket = gcs.bucket("koel");

  // References an existing file, e.g. "file.txt"
  // const file = bucket.file("muazzez ersoy ney kemence taksim.mp3");  
  
  
  // References an existing bucket, e.g. "my-bucket"
//  const bucket = bucket;

  // References an existing file, e.g. "file.txt"
  const file = gcs.bucket("koel").file("muazzez ersoy ney kemence taksim.mp3");

  const options = {
    // The path to which the file should be downloaded, e.g. "./file.txt"
    destination: "./file.mp3"
  };

  // Downloads the file
  return file.download(options)
    .then(() => {
      console.log(`File ${file.name} downloaded to ./file.mp3`);
    });
	
	
	console.log(`Could not determine the media type.`);

