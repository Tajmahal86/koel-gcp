# Use Koel with Google Cloud Storage

Based on koel-aws


1. Create an IAM user, e.g. `koel-user`
1. Create a bucket, e.g. `koel-bucket`
	gsutil mb koel-bukcet
1. Make sure `koel-user` can read `koel-bucket`'s  content.
1. Allow CORS on `koel-bucket`
	gsutil cors set cors-json-file.json gs://koel-bukcet

As of current, only `mp3`, `ogg`, and `m4a` files are supported. Also, your Koel version must be v3.0.0 or later.

1. Clone this repository: `git clone https://github.com/tajamahal86/koel-gcp`
2. Install necessary packages: `cd koel-aws && npm install --production`
3. Copy `.env.example` into `.env` and edit the variables there
4. Deploy the function

	gcloud beta functions deploy helloGCS --stage-bucket cloud_functions_bucket --trigger-bucket  koel_music_bucket